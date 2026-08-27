// const axios = require('axios');


// const getLanguageById = (lang)=>{

//     const language = {
//         "c++":54,
//         "java":62,
//         "javascript":63
//     }


//     return language[lang.toLowerCase()];
// }


// const submitBatch = async (submissions)=>{


// const options = {
//   method: 'POST',
//   url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
//   params: {
//     base64_encoded: 'false'
//   },
//   headers: {
//     'x-rapidapi-key': 'ab99c6ec42mshfd636ec7c6687efp1b9043jsna684835b0591',
//     'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
//     'Content-Type': 'application/json'
//   },
//   data: {
//     submissions
//   }
// };

// async function fetchData() {
// 	try {
// 		const response = await axios.request(options);
// 		return response.data;
// 	} catch (error) {
// 		console.error(error);
// 	}
// }

//  return await fetchData();

// }


// const waiting = async(timer)=>{
//   setTimeout(()=>{
//     return 1;
//   },timer);
// }

// // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

// const submitToken = async(resultToken)=>{

// const options = {
//   method: 'GET',
//   url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
//   params: {
//     tokens: resultToken.join(","),
//     base64_encoded: 'false',
//     fields: '*'
//   },
//   headers: {
//     'x-rapidapi-key': 'ab99c6ec42mshfd636ec7c6687efp1b9043jsna684835b0591',
//     'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
//   }
// };

// async function fetchData() {
// 	try {
// 		const response = await axios.request(options);
// 		return response.data;
// 	} catch (error) {
// 		console.error(error);
// 	}
// }


//  while(true){

//  const result =  await fetchData();

//   const IsResultObtained =  result.submissions.every((r)=>r.status_id>2);

//   if(IsResultObtained)
//     return result.submissions;

  
//   await waiting(1000);
// }



// }


// module.exports = {getLanguageById,submitBatch,submitToken};








// 



const axios = require('axios');

const getLanguageById = (lang) => {
    const language = {
        "c++": { language: "cpp17", versionIndex: "0" },
        "cpp": { language: "cpp17", versionIndex: "0" },      // 👈 add kiya
        "java": { language: "java", versionIndex: "4" },
        "javascript": { language: "nodejs", versionIndex: "4" }
    };

    return language[lang.toLowerCase()];
};

// Ek single testcase submit karke result laata hai
const submitSingle = async ({ source_code, language_id, stdin }) => {
    const options = {
        method: 'POST',
        url: 'https://api.jdoodle.com/v1/execute',
        headers: { 'Content-Type': 'application/json' },
        data: {
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            script: source_code,
            language: language_id.language,
            versionIndex: language_id.versionIndex,
            stdin: stdin || ""
        }
    };

    try {
        const startTime = Date.now();
        const response = await axios.request(options);
        const endTime = Date.now();

        const measuredTime = (endTime - startTime) / 1000; // seconds, cpuTime jaisa hi unit

        return {
            ...response.data,
            cpuTime: response.data.cpuTime || measuredTime // JDoodle null de to fallback use hoga
        };
    } catch (error) {
        console.error(error);
        throw error;
    } 
};

// Judge0 ke submitBatch jaisa hi kaam - saare testcases ek saath bhej dete hain (Promise.all se)
const submitBatch = async (submissions) => {
    const results = await Promise.all(
        submissions.map((sub) => submitSingle(sub))
    );
    return results; // [{output, statusCode, memory, cpuTime}, ...]
};

// Expected output se match karke status decide karna (JDoodle khud match nahi karta)
const compareResults = (results, submissions) => {
    return results.map((result, index) => {
        const actualOutput = (result.output || "").trim();
        const expectedOutput = (submissions[index].expected_output || "").trim();

        return {
            ...result,
            status_id: actualOutput === expectedOutput ? 3 : 4 // 3 = Accepted, 4 = Wrong Answer (Judge0 convention follow kiya)
        };
    });
};

module.exports = { getLanguageById, submitBatch, compareResults };
