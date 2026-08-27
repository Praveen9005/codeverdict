const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const { getLanguageById, submitBatch, compareResults } = require("../utils/problemUtility");

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    // Fetch the problem from database
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).send("Problem not found");
    }

    // Language id JDoodle format mein (getLanguageById ab object deta hai)
    const languageId = getLanguageById(language);
    if (!languageId) {
      return res.status(400).send("Unsupported language");
    }

    // Pehle submission ko 'pending' status ke saath store karo
    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
    });

    const submissions = problem.hiddenTestCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output,
    }));

    // Saare testcases JDoodle pe run karo
    const rawResults = await submitBatch(submissions);

    // Expected output se compare karke status_id set karo
    const testResult = compareResults(rawResults, submissions);

    // Result ko process karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "accepted";
    let errorMessage = null;

    for (const test of testResult) {
      if (test.status_id == 3) {
        testCasesPassed++;
        runtime = runtime + parseFloat(test.cpuTime || 0);
        memory = Math.max(memory, test.memory || 0);
      } else {
        status = "wrong";
        errorMessage = test.output || test.error || "Wrong Answer";
      }
    }

    // Agar koi bhi testcase fail nahi hua toh sab accepted hi rahega,
    // warna last loop mein set hua 'wrong' status hi final rahega
    if (testCasesPassed !== testResult.length) {
      status = "wrong";
    }

    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();

    // ProblemId ko userSchema ke problemSolved mein insert karo agar already nahi hai
    if (status === "accepted" && !req.result.problemSolved.includes(problemId)) {
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }

    // Frontend {accepted, passedTestCases, totalTestCases, error, runtime, memory}
    // shape expect karta hai — Mongoose doc ke field names (status, testCasesPassed,
    // errorMessage, testCasesTotal) match nahi karte the, isliye reshape kar rahe hain
    res.status(201).send({
      accepted: status === "accepted",
      passedTestCases: testCasesPassed,
      totalTestCases: testResult.length,
      error: errorMessage,
      runtime,
      memory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error " + err);
  }
};

const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language)
      return res.status(400).send("Some field missing");

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).send("Problem not found");
    }

    const languageId = getLanguageById(language);
    if (!languageId) {
      return res.status(400).send("Unsupported language");
    }

    const submissions = problem.visibleTestCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output,
    }));

    const rawResults = await submitBatch(submissions);
    const testResult = compareResults(rawResults, submissions);

    // Frontend {success, runtime, memory, testCases:[{stdin, expected_output, stdout, status_id}]}
    // shape expect karta hai — isliye yahan reshape kar rahe hain (JDoodle raw array kaafi nahi tha)
    let totalRuntime = 0;
    let maxMemory = 0;
    let allPassed = true;

    const formattedTestCases = testResult.map((test, index) => {
      const passed = test.status_id === 3;
      if (!passed) allPassed = false;

      totalRuntime += parseFloat(test.cpuTime || 0);
      maxMemory = Math.max(maxMemory, test.memory || 0);

      return {
        stdin: submissions[index].stdin,
        expected_output: submissions[index].expected_output,
        stdout: test.output || "",
        status_id: test.status_id,
      };
    });

    res.status(201).send({
      success: allPassed,
      runtime: totalRuntime,
      memory: maxMemory,
      testCases: formattedTestCases,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error " + err);
  }
};

module.exports = { submitCode, runCode };