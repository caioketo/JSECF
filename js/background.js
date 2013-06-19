chrome.app.runtime.onLaunched.addListener(function(launchData) {
    chrome.app.window.create('window.html', {
        singleton: true,
        frame: 'chrome'
    },
    function (win) {
        win.maximize();
  });
});