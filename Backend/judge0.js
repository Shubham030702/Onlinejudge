require('dotenv').config();

class CodeSubmission {
    constructor() {}
  
    async evaluation(input, output, code) {
      const url = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*';
      const options = {
        method: 'POST',
        headers: {
          'x-rapidapi-key': process.env.Submissionkey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language_id: 52,
          source_code: code,
          stdin: input,
          expected_output: output
        })
      };
  
      try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log("The recieved token is :",result);
        if (result.token) {
          return await this.getSubmission(result.token);
        } else {
          console.error("Token not received from Judge0 API.");
        }
      } catch (error) {
        console.error("Error during code submission:", error);
      }
    }
  
    async getSubmission(token) {
      const url2 = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*&wait=false`;
      const options2 = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.Getsubmissionkey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
      };
  
      try {
        while (true) {
          const response = await fetch(url2, options2);
          const result = await response.json();
          console.log(result.status)
            if (result.status.id === 3) {
                return result
            } else if (result.status.id > 3) {
                return result
            } else {
                console.log("Still in queue...");
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
      } catch (error) {
        console.error("Error during result retrieval:", error);
      }
    }
  }

  module.exports = CodeSubmission;
  