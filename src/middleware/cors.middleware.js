export const corsArgs= {
  origin: function(origin, callback) {
    const whiteList = [
      "http://127.0.0.1:5501",
      "http://127.0.0.1:5500",
      "https://www.google.com",
    ]
    if (!whiteList.includes(origin)) {
      callback(new Error("origin not allowed"))
    }
    callback(null, origin)
  },
}

// app.use((req, res, next)=> {
//   const origin = req.headers.origin
//   const whiteList = [
//       "http://127.0.0.1:5001",
//       "http://127.0.0.1:5000",
//     ]
//     if(!whiteList.includes(origin)) {
//       badRequestException("origin not allowed")
//     }
//     res.headers("Access-Control-Allow-Origin", origin)
//     res.headers("Access-Control-Allow-Methods", "DELETE")
//     res.headers("Access-Control-Allow-Headers", "auth")
//   next()
// })