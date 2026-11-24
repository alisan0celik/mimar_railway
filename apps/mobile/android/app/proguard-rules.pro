# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo modules
#
# Expo resolves its native modules, their exported functions and the option
# records passed to them through Kotlin reflection, so R8 renaming them breaks
# the module at runtime rather than at build time. Two release builds shipped
# with R8 on lost expo-secure-store this way: every token read failed and
# nobody could sign in. Keep the whole namespace and the Kotlin metadata that
# reflection reads; the rest of the app still gets shrunk and obfuscated.
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }
-dontwarn expo.modules.**
-keep class kotlin.Metadata { *; }
-keep class kotlin.reflect.** { *; }
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod

# Google Sign-In reads credentials through Play services' reflective APIs.
-keep class com.google.android.gms.auth.** { *; }

# Add any project specific keep options here:
