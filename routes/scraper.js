var express = require("express");
var router = express.Router();
const Scraper = require("../lib/Scraper");

router.get("/", function (req, res, next) {
  res.render("dashboard/scraper/index", {
    title: "Scraper",
    active: { scraper: true },
  });
});

router.post("/", function (req, res, next) {
  let input = {
    url: req.body.url,
    data_name: req.body.data_name,
    selector_tag: req.body.selector_tag,
  };

  let result = Scraper.scrape(input).then((res) => {
    console.log(res)
    return res;
  });
  res.send({
    title: "Scraper",
    active: { scraper: true },
    result: result
  })
  // res.render("dashboard/scraper/index", {
  //   title: "Scraper",
  //   active: { scraper: true },
  //   result: result
  // });
});

module.exports = router;
