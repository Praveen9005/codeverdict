



const { getLanguageById, submitBatch, compareResults } = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req, res) => {

    const { title, description, difficulty, tags,
        visibleTestCases, hiddenTestCases, startCode,
        referenceSolution, problemCreator
    } = req.body;

    try {

        for (const { language, completeCode } of referenceSolution) {

            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((testcase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            // Judge0 ka batch + token wala flow yaha nahi chahiye
            const rawResults = await submitBatch(submissions);
            // console.log(rawResults);

            // Expected output se compare karke status_id nikalna
            const testResult = compareResults(rawResults, submissions);
            // console.log(testResult);

            for (const test of testResult) {
                if (test.status_id != 3) {
                    return res.status(400).send("Error Occured");
                }
            }

        }

//         for (const { language, completeCode } of referenceSolution) {

//     const languageId = getLanguageById(language);

//     const submissions = visibleTestCases.map((testcase) => ({
//         source_code: completeCode,
//         language_id: languageId,
//         stdin: testcase.input,
//         expected_output: testcase.output
//     }));

//     const rawResults = await submitBatch(submissions);
//     const testResult = compareResults(rawResults, submissions);

//     for (const test of testResult) {
//         if (test.status_id != 3) {
//             // 👇 Temporary debug — asli wajah dikhayega
//             console.log("FAILED LANGUAGE:", language);
//             console.log("RAW RESULT:", test);
//             return res.status(400).json({
//                 message: "Error Occured",
//                 failedLanguage: language,
//                 actualOutput: test.output,
//                 expectedOutput: test.expected_output,
//                 rawError: test
//             });
//         }
//     }
// }

        const userProblem = await Problem.create({
            ...req.body,
            problemCreator: req.result._id
        });

        res.status(201).send("Problem Saved Successfully");
    }
    catch (err) {
        console.log("problem")
        res.status(400).send("Error: " + err);
        
    }
}


const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
   for (const { language, completeCode } of referenceSolution) {

            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((testcase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));


     const rawResults = await submitBatch(submissions);

            // Expected output se compare karke status_id nikalna
            const testResult = compareResults(rawResults, submissions);

            for (const test of testResult) {
                if (test.status_id != 3) {
                    return res.status(400).send("Error Occured");
                }
            }

    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('id title description difficulty tags visibleTestCases startCode referenceSolution');


   if(!getProblem)
    return res.status(404).send("Problem is Missing");

   const videos = await SolutionVideo.findOne({problemId:id})

   if(videos){
    const responseData = {
      ...getProblem.toObject(),
      secureUrl: videos.secureUrl,
      cloudinaryPublicId: videos.cloudinaryPublicId,
      thumbnailUrl : videos.thumbnailUrl,
      duration : videos.duration
    }
    

    return res.status(200).send(responseData);

   }


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req ,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('id title tags difficulty');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const solvedAllProblembyUser = async(req,res)=>{

  try {
    const userId = req.result.id

    const user = await User.findById(userId).populate({
      path:'problemSolved',
      select:"id title difficulty tags"
    })
    res.status(200).send(user.problemSolved);
  } catch (error) {

    res.status(500).send("Error"+error)
    
  }

}

const submittedProblem = async(req, res) => {
  try {
    const userId = req.result.id;
    const problemId = req.params.pid;

    const ans = await Submission.find({ userId, problemId });

    if (ans.length == 0) {
      return res.status(200).send([]);
    }

    return res.status(200).send(ans);

  } catch (error) {
    res.status(500).send("Internal Server Error: " + error.message);
  }
}



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};


