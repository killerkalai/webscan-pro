/**
 * WebScan Pro — Site Monitor Script
 * Served at: https://webscanpro.com/monitor.js
 *
 * How it works:
 * 1. Reads `data-site-key` from the script tag
 * 2. Pings the WebScan Pro monitor endpoint (verifies script installation)
 * 3. WebScan Pro then runs a full background security scan
 * 4. Owner gets emailed if new issues are found
 *
 * Usage:
 * <script src="https://webscanpro.com/monitor.js" data-site-key="wsp_xxxx" async></script>
 */
;(function () {
  'use strict'

  // Find the script tag with our data attribute
  var scripts = document.querySelectorAll('script[data-site-key]')
  var siteKey = null

  for (var i = 0; i < scripts.length; i++) {
    var key = scripts[i].getAttribute('data-site-key')
    if (key && key.indexOf('wsp_') === 0) {
      siteKey = key
      break
    }
  }

  if (!siteKey) {
    console.warn('[WebScan Pro] No valid site key found. Check your embed snippet.')
    return
  }

  // Resolve API base from the script src
  var scriptSrc = document.currentScript
    ? document.currentScript.src
    : (function () {
        var tags = document.getElementsByTagName('script')
        return tags[tags.length - 1].src
      })()

  var apiBase = scriptSrc.replace('/monitor.js', '')

  // Ping the monitor endpoint — this verifies the script is installed
  // and triggers a scan if enough time has passed since last scan
  function ping() {
    var url = apiBase + '/api/monitor?key=' + encodeURIComponent(siteKey)

    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
      })
        .then(function (res) {
          return res.json()
        })
        .then(function (data) {
          if (data && data.monitored) {
            console.log(
              '%c[WebScan Pro] ✓ Security monitoring active',
              'color: #00FF88; font-weight: bold; font-family: monospace'
            )
          }
        })
        .catch(function () {
          // Silent fail — never break the host site
        })
    } else {
      // Fallback for very old browsers
      var img = new Image()
      img.src = url + '&_=' + Date.now()
    }
  }

  // Run after page load to not block rendering
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ping)
  } else {
    // Small delay to avoid impacting initial page metrics
    setTimeout(ping, 1500)
  }
})()
