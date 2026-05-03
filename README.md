# My Steamy App

Aplicacion mobile construida con `Ionic + Angular + Capacitor` que consume la API publica de `CheapShark` para mostrar ofertas de videojuegos, buscar por titulo, guardar un juego favorito de forma local y exponer ese favorito en un widget nativo de Android.

## Funcionalidades

- Visualizacion de `Top Deals` obtenidos desde CheapShark.
- Busqueda de juegos por titulo.
- Modal de detalle con precios, rating y acceso al deal real.
- Apertura del deal con `@capacitor/browser`.
- Guardado local del juego favorito con `@capacitor/preferences`.
- Vista dedicada al juego favorito.
- Widget nativo Android que lee el favorito y muestra ofertas del juego en pantalla de inicio.

## Stack

- `Ionic 8`
- `Angular 20`
- `Capacitor 8`
- `TypeScript`
- `SCSS`
- `CheapShark API`

## Estructura principal

```text
src/app/
  core/
    models/
    services/
  shared/
    components/
  tab1/
    deals page
  tab2/
    favorite page
  tabs/
    bottom tabs navigation

android/app/src/main/
  java/com/felipebarbur/steamyapp/
    GameWidget.java
    WidgetUpdateService.java
  res/layout/
    game_widget.xml
```

## Servicios principales

- `HttpService`
  Centraliza las peticiones HTTP a CheapShark.

- `GameProviderService`
  Obtiene top deals, resultados de busqueda, ofertas por juego y URLs de redireccion.

- `FavoriteGameService`
  Gestiona el favorito local usando `Capacitor Preferences`.

## Pantallas principales

- `Deals`
  Muestra top ofertas, buscador, resultados y acceso al modal de detalle.

- `Favorite`
  Muestra el juego favorito guardado y las ofertas disponibles para ese juego.

## Widget Android

El widget nativo fue implementado en Java y funciona asi:

1. Lee el objeto `favoriteGame` desde `CapacitorStorage`.
2. Consulta CheapShark de forma nativa.
3. Obtiene la informacion del juego y sus ofertas.
4. Renderiza titulo, tienda, precios y ahorro dentro del widget.

Archivos clave:

- `android/app/src/main/java/com/felipebarbur/steamyapp/GameWidget.java`
- `android/app/src/main/java/com/felipebarbur/steamyapp/WidgetUpdateService.java`
- `android/app/src/main/res/layout/game_widget.xml`
- `android/app/src/main/AndroidManifest.xml`

## Requisitos

- `Node.js`
- `npm`
- `Angular CLI`
- `Android Studio` y Android SDK para compilar APK

## Instalacion

```bash
npm install
```

## Ejecutar en navegador

```bash
npm start
```

Servidor de desarrollo:

```text
http://127.0.0.1:4200
```

## Build web

```bash
npm run build
```

## Sincronizar Capacitor

```bash
npx cap sync android
```

## Generar APK debug

Desde la carpeta `android`:

```bash
gradlew.bat assembleDebug
```

APK generado:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Consideraciones

- La app requiere conexion a internet para consumir CheapShark.
- No usa Firebase ni Supabase.
- El favorito se guarda localmente en el dispositivo.
- El widget depende de que exista un juego marcado como favorito.
- `android/local.properties` no debe subirse al repositorio porque depende de la ruta local del SDK.

## Evidencia tecnica sugerida

Para una entrega academica conviene incluir:

- Repositorio GitHub
- APK debug
- Video explicando arquitectura, servicios, vistas y widget Android
- Capturas de la app y del widget funcionando

## Autor

Proyecto desarrollado para el taller de analisis y reconstruccion de `My Steamy App`.
