package com.abhishek1410prathamEnterprise

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "Pratham Enterprise"

  override fun createReactActivityDelegate() =
    DefaultReactActivityDelegate(
      this,
      mainComponentName,
      fabricEnabled
    )

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(null)
  }
}
