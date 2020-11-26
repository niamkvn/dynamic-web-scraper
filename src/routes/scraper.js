var express = require("express");
var router = express.Router();
const Scraper = require("../utils/Scraper");
const ObjectID = require("bson").ObjectID;
// const fs = require("fs");
const Scrape = require("../../models/Scrape");
// const Attribute = require("../../models/Attribute");
// const Selector = require("../../models/Selector");

router.get("/", function (req, res, next) {
  let objectId = new ObjectID();

  res.render("dashboard/scraper/index", {
    layout: "dashboard/layouts/master",
    title: "Scraper",
    objectId: objectId.toString(),
    active: { scraper: true },
  });
});

router.post("/", async function (req, res, next) {
  console.log(req.body);
  let input = {
    url: req.body.url,
    objectId: req.body.objectId,
    attribute: req.body.attribute,
    selector: req.body.selector,
    selector_type: req.body.selector_type,
    selector_traversal_type: req.body.selector_traversal_type,
  };
  console.log(input);

  try {
    let result = await Scraper.scrape(input);

    console.log(result);
    let strXML = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
  xmlns:dc="${input.url}">
  
  <rdf:Description rdf:about="${result["scraped_page_title"]}">`;

    for (let i = 0; i < input.attribute.length; i++) {
      strXML += `\n<dc:${input.attribute[i]}>${
        result[input.attribute[i]]
      }</dc:${input.attribute[i]}>`;
    }
    strXML += `
    </rdf:Description>
  </rdf:RDF>`;

    let arrContentJson = [];
    for (let i = 0; i < input.attribute.length; i++) {
      arrContentJson.push({
        attribute: input.attribute[i],
        value: result[input.attribute[i]]
      });
    }
    // let strJSON = JSON.stringify(arrContentJson);
  
    const scrape = await Scrape.findOne({ where: { code: input.objectId } });
    if (scrape === null) {
      let arrAttrs = []
      // [{"name":"h1","type":"tag","traversal_type":"first","selectors":{"name":"h1","type":"tag","traversal_type":"first"}}]
      for (let i = 0; i < input.attribute.length; i++) {
        arrAttrs.push({
          name: input.attribute[i],
          selectors: {
            name: input.selector[i],
            type: input.selector_type[i],
            traversal_type: input.selector_traversal_type[i],
          }
        })
      }
      let newScrape = await Scrape.create({
        code: input.objectId,
        url: input.url,
        page_title: result["scraped_page_title"],
        content: JSON.stringify({ xml: strXML, json: arrContentJson}),
        // user_id: req.session.userInfo.id
        user_id: 1,
        attributes: JSON.stringify(arrAttrs),
      }).catch((err) => {
        console.log("errMsg:", err);
      });

    } else {
      // update
      let arrAttrs = []
      for (let i = 0; i < input.attribute.length; i++) {
        arrAttrs.push({
          name: input.attribute[i],
          selectors: {
            name: input.selector[i],
            type: input.selector_type[i],
            traversal_type: input.selector_traversal_type[i],
          }
        })
      }
      Scrape.update({
        url: input.url,
        page_title: result["scraped_page_title"],
        content: JSON.stringify({ xml: strXML, json: arrContentJson}),
        // user_id: req.session.userInfo.id
        user_id: 1,
        attributes: JSON.stringify(arrAttrs)
      }, {
        where: {
          code: input.objectId
        }
      })
    }

    res.send({
      objectId: input.objectId,
      isError: false,
      stsCode: 200,
      result: strXML,
      pageTitle: result["scraped_page_title"],
    });
  } catch (error) {
    res.send({
      isError: true,
      stsCode: 500,
      msg: "Someting went wrong, can not scrape the page.",
      errMsg: error.message,
    });
  }
});

router.get("/:objectId/download", async function (req, res, next) {
  let objectId = req.params.objectId;
  const scrape = await Scrape.findOne({ where: { code: objectId } });
  if (scrape === null) {
    return res.status(404).send("Cannot find data.");
  } else {
    const fileData = scrape.content
    const fileName = `${scrape.page_title}.owl`
    const fileType = 'text/plain'
  
    res.writeHead(200, {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': fileType,
    })
  
    const download = Buffer.from(fileData)
    res.end(download)
  }
  // const file = __dirname + `/${objectId}.owl`;
  // res.download(file);
});

module.exports = router;
