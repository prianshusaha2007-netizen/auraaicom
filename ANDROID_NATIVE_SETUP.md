# AURRA Android Native Plugin Setup

This document provides instructions for adding accessibility service and other native Android capabilities to the AURRA APK.

## Required Android Permissions

Add these to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Basic permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Background execution -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Overlay permission -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Bluetooth for earbuds -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Query installed apps -->
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
```

## Accessibility Service Setup

### 1. Create Accessibility Service Class

Create `android/app/src/main/java/app/lovable/aurra/AURRAAccessibilityService.java`:

```java
package app.lovable.aurra;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.os.Build;
import android.os.Bundle;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

public class AURRAAccessibilityService extends AccessibilityService {
    
    private static AURRAAccessibilityService instance;
    
    public static AURRAAccessibilityService getInstance() {
        return instance;
    }
    
    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }
    
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Handle accessibility events
    }
    
    @Override
    public void onInterrupt() {
        // Handle service interrupt
    }
    
    public boolean performClick(int x, int y) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Path clickPath = new Path();
            clickPath.moveTo(x, y);
            
            GestureDescription.StrokeDescription clickStroke = 
                new GestureDescription.StrokeDescription(clickPath, 0, 100);
            GestureDescription.Builder clickBuilder = new GestureDescription.Builder();
            clickBuilder.addStroke(clickStroke);
            
            return dispatchGesture(clickBuilder.build(), null, null);
        }
        return false;
    }
    
    public boolean performSwipe(int startX, int startY, int endX, int endY, int duration) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Path swipePath = new Path();
            swipePath.moveTo(startX, startY);
            swipePath.lineTo(endX, endY);
            
            GestureDescription.StrokeDescription swipeStroke = 
                new GestureDescription.StrokeDescription(swipePath, 0, duration);
            GestureDescription.Builder swipeBuilder = new GestureDescription.Builder();
            swipeBuilder.addStroke(swipeStroke);
            
            return dispatchGesture(swipeBuilder.build(), null, null);
        }
        return false;
    }
    
    public boolean typeText(String text) {
        AccessibilityNodeInfo focusedNode = findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focusedNode != null) {
            Bundle args = new Bundle();
            args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
            return focusedNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
        }
        return false;
    }
    
    public boolean scroll(String direction) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null) {
            int action = direction.equals("down") || direction.equals("right") 
                ? AccessibilityNodeInfo.ACTION_SCROLL_FORWARD 
                : AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD;
            return rootNode.performAction(action);
        }
        return false;
    }
}
```

### 2. Create Accessibility Service Configuration

Create `android/app/src/main/res/xml/accessibility_service_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagIncludeNotImportantViews|flagRequestTouchExplorationMode"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100"
    android:settingsActivity="app.lovable.aurra.MainActivity" />
```

### 3. Register Service in AndroidManifest.xml

```xml
<service
    android:name=".AURRAAccessibilityService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>
```

### 4. Add String Resources

In `android/app/src/main/res/values/strings.xml`:

```xml
<string name="accessibility_service_description">AURRA uses accessibility to automate apps on your behalf. This allows AURRA to open apps, type text, scroll, and perform actions you request.</string>
```

## Capacitor Plugin for Accessibility

Create `android/app/src/main/java/app/lovable/aurra/AURRAAccessibilityPlugin.java`:

```java
package app.lovable.aurra;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AURRAAccessibility")
public class AURRAAccessibilityPlugin extends Plugin {

    @PluginMethod()
    public void checkStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isAvailable", true);
        result.put("isEnabled", isAccessibilityServiceEnabled());
        
        JSObject permissions = new JSObject();
        permissions.put("accessibilityService", isAccessibilityServiceEnabled());
        permissions.put("overlay", Settings.canDrawOverlays(getContext()));
        permissions.put("batteryOptimization", isIgnoringBatteryOptimizations());
        
        result.put("permissions", permissions);
        call.resolve(result);
    }

    @PluginMethod()
    public void requestAccessibility(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod()
    public void requestOverlay(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName()));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod()
    public void openApp(PluginCall call) {
        String packageName = call.getString("packageName");
        try {
            Intent intent = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
            if (intent != null) {
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve(new JSObject().put("success", true));
            } else {
                call.reject("App not found: " + packageName);
            }
        } catch (Exception e) {
            call.reject("Error opening app: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void click(PluginCall call) {
        int x = call.getInt("x", 0);
        int y = call.getInt("y", 0);
        
        AURRAAccessibilityService service = AURRAAccessibilityService.getInstance();
        if (service != null) {
            boolean success = service.performClick(x, y);
            call.resolve(new JSObject().put("success", success));
        } else {
            call.reject("Accessibility service not running");
        }
    }

    @PluginMethod()
    public void typeText(PluginCall call) {
        String text = call.getString("text", "");
        
        AURRAAccessibilityService service = AURRAAccessibilityService.getInstance();
        if (service != null) {
            boolean success = service.typeText(text);
            call.resolve(new JSObject().put("success", success));
        } else {
            call.reject("Accessibility service not running");
        }
    }

    @PluginMethod()
    public void scroll(PluginCall call) {
        String direction = call.getString("direction", "down");
        
        AURRAAccessibilityService service = AURRAAccessibilityService.getInstance();
        if (service != null) {
            boolean success = service.scroll(direction);
            call.resolve(new JSObject().put("success", success));
        } else {
            call.reject("Accessibility service not running");
        }
    }

    @PluginMethod()
    public void swipe(PluginCall call) {
        int startX = call.getInt("startX", 0);
        int startY = call.getInt("startY", 0);
        int endX = call.getInt("endX", 0);
        int endY = call.getInt("endY", 0);
        int duration = call.getInt("duration", 300);
        
        AURRAAccessibilityService service = AURRAAccessibilityService.getInstance();
        if (service != null) {
            boolean success = service.performSwipe(startX, startY, endX, endY, duration);
            call.resolve(new JSObject().put("success", success));
        } else {
            call.reject("Accessibility service not running");
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        Context context = getContext();
        ComponentName expectedComponentName = new ComponentName(context, AURRAAccessibilityService.class);
        String enabledServicesSetting = Settings.Secure.getString(
            context.getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        
        if (enabledServicesSetting == null) return false;
        
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabledServicesSetting);
        
        while (splitter.hasNext()) {
            String componentNameString = splitter.next();
            ComponentName enabledService = ComponentName.unflattenFromString(componentNameString);
            if (enabledService != null && enabledService.equals(expectedComponentName)) {
                return true;
            }
        }
        return false;
    }

    private boolean isIgnoringBatteryOptimizations() {
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }
}
```

## Building the APK

1. Export project to GitHub
2. Clone locally: `git clone <repo-url>`
3. Install dependencies: `npm install`
4. Add Android platform: `npx cap add android`
5. Build web assets: `npm run build`
6. Sync to Android: `npx cap sync android`
7. Add the native code from this guide
8. Open in Android Studio: `npx cap open android`
9. Build APK: Build → Build Bundle(s) / APK(s) → Build APK(s)

## Testing

1. Install APK on Android device
2. Go to Settings → Accessibility → AURRA
3. Enable the accessibility service
4. Grant overlay permission when prompted
5. Test app automation features
