const puppeteer = require("puppeteer");
const Excel = require("exceljs");

const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet("My Sheet");

worksheet.columns = [
  { header: "Name", key: "name", width: 20 },
  { header: "Contact", key: "contact", width: 20 }
];

const getAllPaginationLinks = () => {
  let totalPages = Array.from(document.querySelectorAll("#srchpagination a"));

  totalPages = totalPages.filter(link => link.className !== "dis");

  totalPages = totalPages.slice(0, totalPages.length - 1);

  return totalPages.map(link => link.href);
};

const getDataFromPage = () => {
  const justDialClassToChar = {
    "icon-dc": "+",
    "icon-fe": "(",
    "icon-hg": ")",
    "icon-ba": "-",
    "icon-acb": "0",
    "icon-yz": "1",
    "icon-wx": "2",
    "icon-vu": "3",
    "icon-ts": "4",
    "icon-rq": "5",
    "icon-po": "6",
    "icon-nm": "7",
    "icon-lk": "8",
    "icon-ji": "9"
  };

  const allAgentTiles = Array.from(
    document.querySelectorAll(".store-details.sp-detail")
  );

  const pageData = allAgentTiles.map(agentTiles => {
    const name = agentTiles
      .querySelector(".store-name .lng_cont_name")
      .textContent.trim();

    const contact = Array.from(
      agentTiles.querySelectorAll(".contact-info .mobilesv")
    );

    let contactStr = "";

    for (let i = 0; i < contact.length; ++i) {
      const charNodeClass = contact[i].className.split(" ")[1];

      contactStr += justDialClassToChar[charNodeClass];
    }

    return { name, contact: contactStr };
  });

  const name = [];
  const contact = [];

  // let names = Array.from(
  //   document.querySelectorAll(".store-name .lng_cont_name")
  // );

  // let contacts = Array.from(
  //   document.querySelectorAll(".contact-info .mobilesv")
  // );

  // contacts = contacts.filter(contact => {
  //   const charNodeClass = contact.className.split(" ")[1];

  //   return (
  //     charNodeClass !== "icon-fe" &&
  //     charNodeClass !== "icon-hg" &&
  //     charNodeClass !== "icon-ba"
  //   );
  // });

  // let str = "";

  // for (let i = 0; i < contacts.length; ++i) {
  //   const charNodeClass = contacts[i].className.split(" ")[1];

  //   str += justDialClassToChar[charNodeClass];

  //   if (!((i + 1) % 13)) {
  //     contact.push(str);
  //     str = "";
  //   }
  // }

  for (let i = 0; i < pageData.length; ++i) {
    name.push(pageData[i].name);
    contact.push(pageData[i].contact);
  }

  return { name, contact };
};

const start = async () => {
  const browser = await puppeteer.launch({
    args: [
      "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36"
    ]
  });

  const page = await browser.newPage();
  await page.goto("https://www.justdial.com/Agra/Travel-Agents");

  const pagesLink = await page.evaluate(getAllPaginationLinks);

  let name = [],
    contact = [];

  for (let i = 0; i <= pagesLink.length; ++i) {
    await page.waitFor(1000);
    const data = await page.evaluate(getDataFromPage);

    name = [...name, ...data.name];
    contact = [...contact, ...data.contact];

    const pageLink = pagesLink[i];

    if (i < pagesLink.length) {
      await page.click(`a[href='${pageLink}']`);
    }
  }

  worksheet.getColumn("name").values = name;
  worksheet.getColumn("contact").values = contact;

  workbook.xlsx.writeFile("./agraAgent.xlsx").then(function() {
    console.log("File is written");
  });

  await browser.close();
};

start();
