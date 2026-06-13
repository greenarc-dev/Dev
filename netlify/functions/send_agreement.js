const { Resend } = require("resend");
const chromium = require("@sparticuz/chromium");

exports.handler = async (event) => {

    try {

        const puppeteer =
        (await import("puppeteer-core")).default;

        const data =
        JSON.parse(event.body);

        console.log(
"RECEIVED DATA:",
JSON.stringify(data,null,2)
);
const submittedAt =
new Date().toLocaleString(
    "en-IN",
    {
        timeZone:"Asia/Kolkata",
        dateStyle:"long",
        timeStyle:"medium"
    }
);

const ipAddress =
event.headers["x-forwarded-for"] ||
event.headers["client-ip"] ||
event.headers["x-nf-client-connection-ip"] ||
"Not Available";

        // Validate again server-side

    if(
    !data.consultantData ||
    !data.consultantData.name ||
    !data.consultantData.email ||
    !data.consultantData.mobile
){

    return {
        statusCode:400,
        body:JSON.stringify({
            message:"Missing required fields"
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
html: `

<div style="
font-family:Arial,sans-serif;
max-width:700px;
margin:auto;
">

<h2 style="
margin-bottom:10px;
color:#1f4d3a;
">
Consultant Engagement Agreement Submission
</h2>

<p>
A new Consultant Engagement Agreement has been submitted successfully.
</p>

<table
style="
width:100%;
border-collapse:collapse;
margin-top:15px;
font-size:14px;
">

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
Consultant Name
</td>
<td style="border:1px solid #ccc;padding:8px;">
${data.consultantData.name || "-"}
</td>
</tr>

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
Email Address
</td>
<td style="border:1px solid #ccc;padding:8px;">
${data.consultantData.email || "-"}
</td>
</tr>

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
Mobile Number
</td>
<td style="border:1px solid #ccc;padding:8px;">
${data.consultantData.mobile || "-"}
</td>
</tr>

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
PAN Number
</td>
<td style="border:1px solid #ccc;padding:8px;">
${data.consultantData.pan || "-"}
</td>
</tr>

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
Place
</td>
<td style="border:1px solid #ccc;padding:8px;">
${data.consultantData.place || "-"}
</td>
</tr>

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
Submission Date & Time
</td>
<td style="border:1px solid #ccc;padding:8px;">
${submittedAt}
</td>
</tr>

<tr>
<td style="border:1px solid #ccc;padding:8px;font-weight:bold;">
IP Address
</td>
<td style="border:1px solid #ccc;padding:8px;">
${ipAddress}
</td>
</tr>

</table>

<p style="
margin-top:20px;
font-size:13px;
color:#666;
">
This email was generated automatically by the Green Architects Consultant Engagement Agreement System.
</p>

</div>

`,

attachments: [
{
    filename:
    `Consultant_Engagement_Agreement_${data.consultantData.name.replace(/\s+/g,"_")}.pdf`,
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
