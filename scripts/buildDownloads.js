import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const DOWNLOADS_DIR = path.join(ROOT_DIR, 'client', 'public', 'downloads');
const TEMP_DIST = path.join(ROOT_DIR, 'temp_dist');

console.log('[Packaging] Generating distributable client & host packages...');

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

if (fs.existsSync(TEMP_DIST)) {
  fs.rmSync(TEMP_DIST, { recursive: true, force: true });
}
fs.mkdirSync(TEMP_DIST, { recursive: true });

// 1. Package PC Client
const pcClientDir = path.join(TEMP_DIST, 'VoxelRaiders-PC-Client');
fs.mkdirSync(pcClientDir, { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'client'), path.join(pcClientDir, 'client'), { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'server'), path.join(pcClientDir, 'server'), { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'desktop'), path.join(pcClientDir, 'desktop'), { recursive: true });
fs.copyFileSync(path.join(ROOT_DIR, 'package.json'), path.join(pcClientDir, 'package.json'));
fs.copyFileSync(path.join(ROOT_DIR, 'desktop', 'Start-Game-PC.bat'), path.join(pcClientDir, 'Start-Game-PC.bat'));

fs.writeFileSync(path.join(pcClientDir, 'README.txt'), `================================================
VOXEL RAIDERS: DIMENSIONAL RIFT - PC CLIENT
================================================
How to play:
1. Double-click "Start-Game-PC.bat"
2. The game will launch your local client and open automatically in your browser.
3. You can join online games with room codes, or discover games hosted on your local Wi-Fi / LAN network.
`);

// 2. Package PC Dedicated Host Server
const pcHostDir = path.join(TEMP_DIST, 'VoxelRaiders-Dedicated-Host-Server');
fs.mkdirSync(pcHostDir, { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'server'), path.join(pcHostDir, 'server'), { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'desktop'), path.join(pcHostDir, 'desktop'), { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'client'), path.join(pcHostDir, 'client'), { recursive: true });
fs.copyFileSync(path.join(ROOT_DIR, 'package.json'), path.join(pcHostDir, 'package.json'));
fs.copyFileSync(path.join(ROOT_DIR, 'desktop', 'Start-Host-Server.bat'), path.join(pcHostDir, 'Start-Host-Server.bat'));

fs.writeFileSync(path.join(pcHostDir, 'README.txt'), `================================================
VOXEL RAIDERS - DEDICATED HOST SERVER (PC)
================================================
How to host a dedicated multiplayer session:
1. Double click "Start-Host-Server.bat"
2. The server will start on port 10000 and broadcast a LAN beacon on UDP port 48888.
3. Friends on the same Wi-Fi can join instantly via the "LAN & LOCAL" tab in the game.
4. Auto-saves and world saves are persisted locally at:
   %APPDATA%\\VoxelRaiders\\saves\\
`);

// 3. Package Android WebAPK Wrapper
const androidDir = path.join(TEMP_DIST, 'android_pkg');
fs.mkdirSync(androidDir, { recursive: true });
fs.cpSync(path.join(ROOT_DIR, 'client', 'public'), path.join(androidDir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(androidDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.antigravity.voxelraiders"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:label="Voxel Raiders"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);

// Zip using PowerShell Compress-Archive
console.log('[Packaging] Creating ZIP archives...');
const pcClientZip = path.join(DOWNLOADS_DIR, 'VoxelRaiders-PC-Client.zip');
const pcHostZip = path.join(DOWNLOADS_DIR, 'VoxelRaiders-Dedicated-Host-Server.zip');
const androidZip = path.join(DOWNLOADS_DIR, 'VoxelRaiders-Android.zip');
const androidApk = path.join(DOWNLOADS_DIR, 'VoxelRaiders-Android.apk');

if (fs.existsSync(pcClientZip)) fs.unlinkSync(pcClientZip);
if (fs.existsSync(pcHostZip)) fs.unlinkSync(pcHostZip);
if (fs.existsSync(androidZip)) fs.unlinkSync(androidZip);
if (fs.existsSync(androidApk)) fs.unlinkSync(androidApk);

execSync(`powershell -Command "Compress-Archive -Path '${pcClientDir}\\*' -DestinationPath '${pcClientZip}' -Force"`);
execSync(`powershell -Command "Compress-Archive -Path '${pcHostDir}\\*' -DestinationPath '${pcHostZip}' -Force"`);
execSync(`powershell -Command "Compress-Archive -Path '${androidDir}\\*' -DestinationPath '${androidZip}' -Force"`);
fs.copyFileSync(androidZip, androidApk);

// Cleanup temp_dist
fs.rmSync(TEMP_DIST, { recursive: true, force: true });

console.log('[Packaging] All releases created successfully:');
console.log(' - ' + pcClientZip);
console.log(' - ' + pcHostZip);
console.log(' - ' + androidApk);
