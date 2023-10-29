const http = require('http'); // node http 模块
const connect = require('connect'); // connect, 应用http中间件
const proxyMiddleware = require("http-proxy-middleware"); // 用于创建中间件

async function fetchResponse(proxyRes, req, res) {
  const proxyUrl = `${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path}`;
  res.setHeader("cache-control", "no-store");
  const ans = await fetch(proxyUrl, {
    method: "GET",
    credentials: "include",
    headers: {
      Cookie: req.headers.cookie,
    },
  });

  return ans.json();
}

class WReadProxy {
  constructor(context, port) {
    const app = connect();

    app.use("/", proxyMiddleware.createProxyMiddleware({
      target: "https://weread.qq.com",
      changeOrigin: true,
      secure: false,
      selfHandleResponse: true,
      onProxyRes: this.onProxyRes(context),
    }));

    this.proxy = this.startProxy(app, port);
  }

  onProxyRes(context) {
    const resInter = async (responseBuffer, proxyRes, req, res) => {
      // 解决跨域问题
      proxyRes.headers["Access-Control-Allow-Origin"] = "*";
      delete proxyRes.headers["x-frame-options"];
      delete proxyRes.headers["Content-Security-Policy"];

      // cookie
      if (req.url.includes("/web/login/weblogin")) {
        const tempKey = Math.random().toString().slice(-9);
        context.globalState.update("renewalKey", tempKey);
        res.setHeader(
          "set-cookie",
          `wr_fp=${tempKey}; Max-Age=31104000; Domain=localhost;secure;SameSite=None; Path=/;`
        );
      }

      // 解决跨站问题
      if (proxyRes.headers["set-cookie"]) {
        const cookies = [];

        proxyRes.headers["set-cookie"].forEach(cookie => {
          cookies.push(
            cookie.replace(
              "Domain=.weread.qq.com;",
              "Domain=localhost;secure;SameSite=None;"
            )
          );
        });
        res.setHeader("set-cookie", cookies);
      }

      // 书籍划线
      if (req.url.includes("/web/book/bookmarklist")) {
        const result = (await fetchResponse(proxyRes, req, res));

        return JSON.stringify(result);
      }

      return responseBuffer;
    }

    return proxyMiddleware.responseInterceptor(resInter);
  }

  startProxy(app, port) {
    return http.createServer(app).listen(port, () => {
      console.log(`wx-proxy server start at ${port}`);
    });
  }
}

module.exports = WReadProxy;
