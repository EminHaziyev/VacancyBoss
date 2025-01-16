require("dotenv").config();
const mongoose = require("mongoose")
const axios = require("axios");
const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.get("/ping", (req, res) => {
    res.send("Server is alive");
});

mongoose.connect(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
const siteSchema = {
    name: {
        type: String,
        required: true
    },
    lastVacancy: {
        type: String,
        required: true
    }
}
const Site = mongoose.model("Site", siteSchema);

async function sendVacancy(siteName, vacancyName, vacancyHost, vacancyLink) {
    const url = `https://api.telegram.org/bot${process.env.BOT_ID}/sendMessage`;
    const message = `<i>Yeni vakansiya🆕</i>\n_____________\n<strong>${vacancyName}</strong> \n${vacancyHost}\n_____________\nVakansiya saytı: <b>${siteName}</b> \Keçid⬇️\n${vacancyLink}\n\nVacancyBoss ilə bütün vakansiyalardan anında xəbərdar olun: `;
    try {
        const response = await axios.post(url, {
            chat_id: process.env.CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        const newRecord = await Site.findOneAndUpdate({ name: siteName }, { lastVacancy: vacancyName });
    }
    catch (err) {
        console.log("ERR while updating last vacancy", err);
    }


}
//search_v2 because there are premium (on top) vacancies
async function search_v2(siteName, siteUrl, siteVacancySelector, siteCreatorSelector, siteLinkSelector) {
    const name = siteName;
    const url = siteUrl;
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.goto(url, { waitUntil: "networkidle2" , timeout: 60000 });

        await page.waitForSelector(siteVacancySelector, { timeout: 120000 });
        const newVacancyName = await page.$$eval(siteVacancySelector, elements => {

            if (elements.length > 1) {
                return elements[1].textContent.trim();
            }

        });

        const newVacancyCreator = await page.$$eval(siteCreatorSelector, elements => {

            if (elements.length > 1) {
                return elements[1].textContent.trim();
            }

        });
        const newVacancyLink = await page.$$eval(siteLinkSelector, elements => {

            if (elements.length > 1) {
                return elements[1].href;
            }

        });
        const site = await Site.findOne({ name });

        if (newVacancyName != site.lastVacancy) {

            sendVacancy(siteName, newVacancyName, newVacancyCreator, newVacancyLink);
            await browser.close();
            return false;
        }
        else{
            await browser.close();
            return false;
        }

      
    }
    catch (err) {
        console.log(err);
    }
}


//search_v1 because there are no premium (on top) vacancies
async function search_v1(siteName, siteUrl, siteVacancySelector, siteCreatorSelector, siteLinkSelector) {
    const name = siteName;
    const url = siteUrl;
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000  });

        // await page.waitForSelector(siteVacancySelector);
        const newVacancyName = await page.$eval(siteVacancySelector, element => {

            return element.textContent.trim();

        });

        const newVacancyCreator = await page.$eval(siteCreatorSelector, element => {

            return element.textContent.trim();

        });
        const newVacancyLink = await page.$eval(siteLinkSelector, element => {

            return element.href;

        });
        const site = await Site.findOne({ name });

        if (newVacancyName != site.lastVacancy) {

            sendVacancy(siteName, newVacancyName, newVacancyCreator, newVacancyLink);
            await browser.close();
            return false;
        }
        else{
            
            await browser.close();
            return false;
        }

        
    }
    catch (err) {
        console.log(err);
    }
}
//saerch_v3 because busy.az has different structure
async function search_v3(siteName, siteUrl, siteVacancySelector, siteCreatorSelector, siteLinkSelector) {
    const name = siteName;
    const url = siteUrl;
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000  });

        // await page.waitForSelector(siteVacancySelector, { timeout: 60000 });
        const newVacancyName = await page.$eval(siteVacancySelector, element => {

            return element.textContent.trim();

        });

        const newVacancyCreator = await page.$eval(siteCreatorSelector, element => {

            return element.nextSibling.textContent.trim();

        });
        const newVacancyLink = await page.$eval(siteLinkSelector, element => {

            return element.href;

        });
        const site = await Site.findOne({ name });

        if (newVacancyName != site.lastVacancy) {

            sendVacancy(siteName, newVacancyName, newVacancyCreator, newVacancyLink);
            await browser.close();
            return false;
        }
        else{

            await browser.close();
            return false;
        }

        
    }
    catch (err) {
        console.log(err);
    }
}
async function searchAll() {

    try {

        await search_v1("boss.az", "https://boss.az/vacancies.mobile?search%5Bcategory_id%5D=38", ".collection-i-link", ".collection-i-company", ".collection-i-link");

        await search_v1("offer.az", "https://www.offer.az/category/it-vakansiyalari/", ".job-card__title", ".job-card__meta em", ".job-card__title");

        await search_v2("hellojob.az", "https://www.hellojob.az/is-elanlari/texnologiya", ".vacancies__desc h3", ".vacancy_item_company", ".vacancies__item");

        await search_v1("jobs.glorri.az", "https://jobs.glorri.com/?jobFunctions=science-technology-engineering", "div.grid a div:nth-of-type(2) h3", "div.grid a div:nth-of-type(2) div p", "div.grid a");

        await search_v3("busy.az", "https://busy.az/vacancies?categories%5B%5D=12&categories%5B%5D=81&categories%5B%5D=82&categories%5B%5D=83&categories%5B%5D=84&categories%5B%5D=85&categories%5B%5D=86&categories%5B%5D=87&categories%5B%5D=88&categories%5B%5D=90&categories%5B%5D=91&categories%5B%5D=92&categories%5B%5D=93&categories%5B%5D=154&fullSelect=on&minimum_salary=&maximum_salary=", ".job-listing-title", ".job-listing-footer ul li i.icon-material-outline-business", ".with-apply-button");
        console.log("All search functions executed");
    }
    catch (err) {
        console.log("Error in search functions", err);
        
    }

}
setInterval(searchAll, 1000*60*10);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
