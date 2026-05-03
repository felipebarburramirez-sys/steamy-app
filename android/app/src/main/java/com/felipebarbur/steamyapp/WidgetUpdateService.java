package com.felipebarbur.steamyapp;

import android.app.PendingIntent;
import android.app.Service;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class WidgetUpdateService extends Service {
    private static final String API_URL = "https://www.cheapshark.com/api/1.0";
    private static final String ASSET_URL = "https://www.cheapshark.com";
    private static final String STORAGE_NAME = "CapacitorStorage";
    private static final String FAVORITE_KEY = "favoriteGame";
    private static final long ROTATION_DELAY_MS = 5000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    private final Object offersLock = new Object();
    private final List<DealOffer> offers = new ArrayList<>();

    private String loadedGameId = "";
    private boolean fetching = false;
    private int currentIndex = 0;

    private final Runnable rotationTask = new Runnable() {
        @Override
        public void run() {
            tick();
            handler.postDelayed(this, ROTATION_DELAY_MS);
        }
    };

    public static void start(Context context) {
        Intent intent = new Intent(context, WidgetUpdateService.class);

        try {
            context.startService(intent);
        } catch (RuntimeException ignored) {
            GameWidget.renderEmpty(context);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handler.removeCallbacks(rotationTask);
        handler.post(rotationTask);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(rotationTask);
        executorService.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void tick() {
        String favoriteJson = readFavoriteJson();

        if (favoriteJson == null || favoriteJson.isEmpty()) {
            loadedGameId = "";
            synchronized (offersLock) {
                offers.clear();
            }
            renderEmpty();
            return;
        }

        String favoriteGameId = parseFavoriteGameId(favoriteJson);

        if (favoriteGameId.isEmpty()) {
            renderEmpty();
            return;
        }

        boolean shouldFetch;
        synchronized (offersLock) {
            shouldFetch = !favoriteGameId.equals(loadedGameId) || offers.isEmpty();
        }

        if (shouldFetch) {
            fetchOffers(favoriteJson, favoriteGameId);
            return;
        }

        renderNextOffer();
    }

    private String readFavoriteJson() {
        SharedPreferences preferences = getSharedPreferences(STORAGE_NAME, MODE_PRIVATE);
        return preferences.getString(FAVORITE_KEY, null);
    }

    private String parseFavoriteGameId(String favoriteJson) {
        try {
            JSONObject favorite = new JSONObject(favoriteJson);
            return favorite.optString("gameId", "");
        } catch (Exception ignored) {
            return "";
        }
    }

    private void fetchOffers(String favoriteJson, String gameId) {
        if (fetching) {
            return;
        }

        fetching = true;
        executorService.execute(() -> {
            try {
                List<DealOffer> fetchedOffers = loadOffers(favoriteJson, gameId);

                synchronized (offersLock) {
                    offers.clear();
                    offers.addAll(fetchedOffers);
                    loadedGameId = gameId;
                    currentIndex = 0;
                }

                handler.post(this::renderNextOffer);
            } catch (Exception ignored) {
                handler.post(this::renderEmpty);
            } finally {
                fetching = false;
            }
        });
    }

    private List<DealOffer> loadOffers(String favoriteJson, String gameId) throws Exception {
        JSONObject favorite = new JSONObject(favoriteJson);
        String encodedGameId = URLEncoder.encode(gameId, StandardCharsets.UTF_8.name());
        JSONObject game = new JSONObject(readUrl(API_URL + "/games?id=" + encodedGameId));
        JSONObject info = game.optJSONObject("info");
        JSONArray deals = game.optJSONArray("deals");
        Map<String, StoreInfo> stores = loadStores();

        String title = favorite.optString("title", "");
        String thumb = favorite.optString("thumb", "");

        if (info != null) {
            title = info.optString("title", title);
            thumb = info.optString("thumb", thumb);
        }

        Bitmap coverBitmap = downloadBitmap(thumb);
        List<DealOffer> loadedOffers = new ArrayList<>();

        if (deals == null) {
            return loadedOffers;
        }

        for (int index = 0; index < deals.length() && loadedOffers.size() < 12; index++) {
            JSONObject deal = deals.getJSONObject(index);
            StoreInfo store = stores.get(deal.optString("storeID", ""));

            if (store == null) {
                store = new StoreInfo("Unknown store", "");
            }

            loadedOffers.add(new DealOffer(
                title,
                deal.optString("dealID", favorite.optString("dealId", "")),
                store.name,
                deal.optDouble("price", 0),
                deal.optDouble("retailPrice", 0),
                deal.optDouble("savings", 0),
                coverBitmap,
                downloadBitmap(store.logoUrl)
            ));
        }

        return loadedOffers;
    }

    private Map<String, StoreInfo> loadStores() throws Exception {
        JSONArray storesJson = new JSONArray(readUrl(API_URL + "/stores"));
        Map<String, StoreInfo> stores = new HashMap<>();

        for (int index = 0; index < storesJson.length(); index++) {
            JSONObject store = storesJson.getJSONObject(index);
            JSONObject images = store.optJSONObject("images");
            String logoPath = images == null ? "" : images.optString("logo", "");

            stores.put(
                store.optString("storeID", ""),
                new StoreInfo(store.optString("storeName", "Unknown store"), normalizeAssetUrl(logoPath))
            );
        }

        return stores;
    }

    private void renderNextOffer() {
        DealOffer offer;

        synchronized (offersLock) {
            if (offers.isEmpty()) {
                renderEmpty();
                return;
            }

            offer = offers.get(currentIndex % offers.size());
            currentIndex++;
        }

        RemoteViews views = new RemoteViews(getPackageName(), R.layout.game_widget);
        bindOpenAppIntent(views);

        if (offer.coverBitmap != null) {
            views.setImageViewBitmap(R.id.widget_background_image, offer.coverBitmap);
        } else {
            views.setImageViewResource(R.id.widget_background_image, R.mipmap.ic_launcher);
        }

        bindOfferPage(views, offer);
        updateWidgets(views);
    }

    private void bindOfferPage(RemoteViews views, DealOffer offer) {
        views.setTextViewText(R.id.widget_title, offer.title);
        views.setTextViewText(R.id.widget_store, offer.storeName);
        views.setTextViewText(R.id.widget_sale_price, formatCurrency(offer.salePrice));
        views.setTextViewText(R.id.widget_normal_price, formatCurrency(offer.normalPrice));
        views.setTextViewText(R.id.widget_savings, "-" + Math.round(offer.savings) + "%");

        if (offer.storeLogoBitmap != null) {
            views.setImageViewBitmap(R.id.widget_store_logo, offer.storeLogoBitmap);
        } else {
            views.setImageViewResource(R.id.widget_store_logo, R.mipmap.ic_launcher);
        }
    }

    private void renderEmpty() {
        GameWidget.renderEmpty(this);
    }

    private void updateWidgets(RemoteViews views) {
        int[] widgetIds = GameWidget.getWidgetIds(this);

        if (widgetIds.length == 0) {
            return;
        }

        AppWidgetManager.getInstance(this).updateAppWidget(widgetIds, views);
    }

    private void bindOpenAppIntent(RemoteViews views) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());

        if (launchIntent == null) {
            return;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
    }

    private String readUrl(String urlString) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(urlString).openConnection();
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);
        connection.setRequestMethod("GET");

        try (InputStream inputStream = new BufferedInputStream(connection.getInputStream());
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            StringBuilder builder = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }

            return builder.toString();
        } finally {
            connection.disconnect();
        }
    }

    private Bitmap downloadBitmap(String urlString) {
        if (urlString == null || urlString.isEmpty()) {
            return null;
        }

        HttpURLConnection connection = null;

        try {
            connection = (HttpURLConnection) new URL(urlString).openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);

            try (InputStream inputStream = connection.getInputStream()) {
                return BitmapFactory.decodeStream(inputStream);
            }
        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String normalizeAssetUrl(String path) {
        if (path == null || path.isEmpty()) {
            return "";
        }

        if (path.startsWith("http")) {
            return path;
        }

        if (path.startsWith("//")) {
            return "https:" + path;
        }

        return ASSET_URL + path;
    }

    private String formatCurrency(double value) {
        return String.format(Locale.US, "$%.2f", value);
    }

    private static final class StoreInfo {
        final String name;
        final String logoUrl;

        StoreInfo(String name, String logoUrl) {
            this.name = name;
            this.logoUrl = logoUrl;
        }
    }

    private static final class DealOffer {
        final String title;
        final String dealId;
        final String storeName;
        final double salePrice;
        final double normalPrice;
        final double savings;
        final Bitmap coverBitmap;
        final Bitmap storeLogoBitmap;

        DealOffer(
            String title,
            String dealId,
            String storeName,
            double salePrice,
            double normalPrice,
            double savings,
            Bitmap coverBitmap,
            Bitmap storeLogoBitmap
        ) {
            this.title = title;
            this.dealId = dealId;
            this.storeName = storeName;
            this.salePrice = salePrice;
            this.normalPrice = normalPrice;
            this.savings = savings;
            this.coverBitmap = coverBitmap;
            this.storeLogoBitmap = storeLogoBitmap;
        }
    }
}
