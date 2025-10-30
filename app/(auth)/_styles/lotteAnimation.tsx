import WebView from "react-native-webview";

export default function LottieAnimation() {
    return (
        <WebView
        originWhitelist={["*"]}
        style={{ backgroundColor: 'transparent' }}
        javaScriptEnabled
        domStorageEnabled
        source={{
          html: `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<style>
  html, body { margin:0; padding:0; background: transparent; height:100%; }
  .wrap { display:flex; align-items:center; justify-content:center; height:100%; }
  dotlottie-player { width:100%; height:100%; }
</style>
<script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>
</head>
<body>
<div class="wrap">
  <dotlottie-player src="https://lottie.host/aa0a87b3-8645-4603-b29c-975c563e96a8/NB3qEaEjPn.lottie" autoplay loop></dotlottie-player>
</div>
</body>
</html>`
        }}
      />
    );
}