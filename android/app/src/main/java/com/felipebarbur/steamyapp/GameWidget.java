package com.felipebarbur.steamyapp;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class GameWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);
        renderEmpty(context);
        WidgetUpdateService.start(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        WidgetUpdateService.start(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        context.stopService(new Intent(context, WidgetUpdateService.class));
    }

    static int[] getWidgetIds(Context context) {
        ComponentName widget = new ComponentName(context, GameWidget.class);
        return AppWidgetManager.getInstance(context).getAppWidgetIds(widget);
    }

    static void renderEmpty(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.game_widget);
        views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_empty_title));
        views.setTextViewText(R.id.widget_store, context.getString(R.string.widget_empty_store));
        views.setTextViewText(R.id.widget_sale_price, "$0.00");
        views.setTextViewText(R.id.widget_normal_price, "");
        views.setTextViewText(R.id.widget_savings, "-0%");
        views.setImageViewResource(R.id.widget_store_logo, R.mipmap.ic_launcher);
        views.setImageViewResource(R.id.widget_background_image, R.mipmap.ic_launcher);

        int[] widgetIds = getWidgetIds(context);

        if (widgetIds.length > 0) {
            AppWidgetManager.getInstance(context).updateAppWidget(widgetIds, views);
        }
    }
}
