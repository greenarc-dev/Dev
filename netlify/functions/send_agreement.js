const { Resend } = require("resend");
const chromium = require("@sparticuz/chromium");

exports.handler = async (event) => {

    try {

        const puppeteer =
        (await import("puppeteer-core")).default;

        const data =
        JSON.parse(event.body);


        // Validate again server-side

    if(!data.consultantName){

        return {
            statusCode:400,
            body:JSON.stringify({
                message:"Missing fields"
            })
        };
    }
    

        const browser =
        await puppeteer.launch({

            args:
            chromium.args,

            executablePath:
            await chromium.executablePath(),

            defaultViewport:
            chromium.defaultViewport,

            headless:true

        });

        const page =
        await browser.newPage();

        await page.setContent(
    data.html,
    {
        waitUntil:"networkidle0",
        timeout:120000
    }
);

        await page.emulateMediaType(
            "print"
        );

      const pdfBuffer =
await page.pdf({

    format:"A4",

    printBackground:true,

    preferCSSPageSize:true,

    displayHeaderFooter:false,

    margin:{
        top:"10mm",
        right:"10mm",
        bottom:"10mm",
        left:"10mm"
    }

});

await browser.close();
 

        const resend =
        new Resend(
            process.env.Dev_Key
        );


console.log(
    "PDF bytes:",
    pdfBuffer.length
);

console.log(
    "PDF header:",
    pdfBuffer
    .slice(0,20)
    .toString()
);

console.log("PDF SIZE:", pdfBuffer.length);
console.log(
    "PDF HEADER:",
    pdfBuffer.slice(0, 10).toString()
);

const pdfBase64 =
Buffer.from(pdfBuffer).toString("base64");

console.log(
    "BASE64 LENGTH:",
    pdfBase64.length
);


        const emailResult =
        await resend.emails.send({

            from:
            "ceo@greenarchitects.in",

            to:[
                "ceo@greenarchitects.in",
                data.consultantData.email
            ],

            subject:
            "Consultant Engagement Agreement - Submission",

            html:`

                <h2>
                Consultant Engagement Agreement 
                </h2>

                <p>
                Name:
                ${data.consultantData.name}
                </p>

                <p>
                Email:
                ${data.consultantData.email}
                </p>

                <p>
                Phone number:
                ${data.consultantData.mobile}
                </p>
            `,


attachments: [
  {
    filename: "Consultant_Agreement.pdf",
    content: pdfBase64
  }
]

        });

  console.log(
   "EMAIL RESULT:",
   JSON.stringify(emailResult)
);



return {

    statusCode:200,

    body:JSON.stringify({
        success:true
    })

};
    } catch(error){

        console.error(error);

        return {

            statusCode:500,

            body:JSON.stringify({
                error:error.message
            })

        };

    }

};
