# 📱 FinTrack Native Android Build Guide

This project is pre-configured with **Capacitor** by Ionic to compile the web application into a high-performance, native Android application (`.apk` / `.aab`).

We have prepared a complete Android native container in the `/android` directory, complete with Gradle build scripts, Android Manifest permissions, and a context-aware secure API bridge.

---

## 🛠️ Step-by-Step Local Android Compilation Guide

Because compiling native Android applications requires a Java Development Kit (JDK) and Android SDK, you should build the app on your local computer (Windows, macOS, or Linux).

### Prerequisites
Before you start, make sure you have the following installed on your machine:
1. **Node.js** (v18 or higher)
2. **Android Studio** (includes SDK, emulator, and build tools)
3. **Java Development Kit (JDK) 17** (standard for modern Android builds)

---

### Step 1: Download or Export the Code
Export this project as a **ZIP** file or clone it via the **Settings / Export** menu in the top right. Extract the folder on your local computer.

### Step 2: Install dependencies
Navigate to your project directory in your terminal and install node packages:
```bash
npm install
```

### Step 3: Compile & Sync the Mobile Assets
Run our custom compilation script. This command compiles the React/Vite bundle and copies all assets directly into the native Android structure:
```bash
npm run mobile:sync
```

### Step 4: Open in Android Studio
Launch Android Studio and open the `/android` subdirectory of this project.

Alternatively, you can open it directly from the terminal:
```bash
npm run mobile:open
```
Android Studio will automatically index the project, download the required Gradle wrappers and packages, and sync everything.

### Step 5: Run or Build the APK
- **To test on an Emulator:** Click the **Run** button (green play icon in top bar of Android Studio) to launch the app on your virtual device.
- **To build a Debug APK:** Go to the top menu and select **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The compiled `.apk` will be saved in:
  `android/app/build/outputs/apk/debug/app-debug.apk`
- **To build a Release Bundle (for Play Store):** Go to **Generate Signed Bundle / APK** in the Build menu.

---

## 🚀 Live Reload & Testing on a Physical Device

To speed up active development without having to re-build on every code change, you can stream your local changes directly onto an emulator or USB-connected physical phone.

1. Ensure your phone/emulator and computer are on the same Wi-Fi network.
2. Start the development server locally:
   ```bash
   npm run dev
   ```
3. Run the live reload script to redirect native app views to your computer’s local IP (e.g., `192.168.1.100` or port `3000`):
   ```bash
   npx cap @capacitor/cli run android --live-reload --external
   ```

---

## 🔒 Mobile API & State Security Configuration

Native Android apps cannot fetch standard relative `/api/*` endpoints because there is no browser origin. 

Our client-side API layer `/src/lib/api.ts` is **fully optimized** to resolve this seamlessly:
- **Web Build:** Uses normal relative endpoints (`/api/...`).
- **Android Native App:** Auto-detects the mobile context and proxies all API endpoints directly to your hosted production backend:
  `https://ais-pre-7jtw64vzz42aknybbz4z46-457205007868.asia-east1.run.app`

### Customizing the API Endpoint
If you host a custom developer backend or want to redirect API traffic, you can declare the target variable in your `.env` file or device configuration:
```env
VITE_MOBILE_API_URL=https://your-custom-backend.com
```

---

## 📁 Key File Structure
- `capacitor.config.ts`: Capacitor main bridge settings (Defines App ID: `com.fintrack.app` and App Name: `FinTrack`).
- `/android`: Gradle wrapper, configs, and native Android resources.
- `/android/app/src/main/AndroidManifest.xml`: Controls camera, internet permissions, and main activities.
- `/android/app/src/main/res/`: Contains application launcher icons, splash screen layouts, and styling strings.
