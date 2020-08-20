var express = require("express");
var router = express.Router();
const Scraper = require("../lib/Scraper");

router.get("/", function (req, res, next) {
  res.render("dashboard/scraper/index", {
    title: "Scraper",
    active: { scraper: true },
  });
});

router.post("/", async function (req, res, next) {
  console.log(req.body);
  let input = {
    url: req.body.url,
    attribute: req.body.attribute,
    selector: req.body.selector,
    selector_type: req.body.selector_type,
    selector_traversal_type: req.body.selector_traversal_type,
  };
  console.log(input);

  try {
    let result = await Scraper.scrape(input);
    console.log(result);
    let str = `
  <?xml version="1.0"?>
  <rdf:RDF 
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
  xmlns:rdf="${input.url}">
  
  <rdf:Description rdf:about="Artikel berita"`;
    for (let i = 0; i < input.attribute.length; i++) {
      str += `\n<artikel:${input.attribute[i]}>${
        result[input.attribute[i]]
      }</artikel:${input.attribute[i]}>`;
    }
    res.send(str);
  } catch (error) {
    res.send({
      isError: true,
      stsCode: 500,
      msg: "Someting went wrong, can not scrape the page.",
      errMsg: error.message
    });
  }
});

module.exports = router;
