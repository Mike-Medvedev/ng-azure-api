const { AzureOpenAI } = require("openai");

// Load the .env file if it exists
const dotenv = require("dotenv");
dotenv.config();
require("dotenv/config");

// You will need to set these environment variables or edit the following values
const endpoint = process.env["AZURE_OPENAI_ENDPOINT"] || "<endpoint>";
const apiKey = process.env["AZURE_OPENAI_API_KEY"] || "<api key>";
const apiVersion = "2024-05-01-preview";
const deployment = "spotify-deploy"; //This must match your deployment name.




async function main(prompt) {
    if (typeof prompt === 'string' && prompt) {
        const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
        const result = await client.completions.create({ prompt: [prompt], model: deployment, max_tokens: 128 });
        let choiceArray = [];
      
        for (const choice of result.choices) {
            choiceArray.push(choice.text);
            console.log(choice.text);
        } 

        return choiceArray;
    }
    throw new Error('Error: prompt is not a string or is falsy');
}


// main().catch((err) => {
//   console.error("The sample encountered an error:", err);
// });

module.exports = { main };