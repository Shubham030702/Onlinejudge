class CodeSubmission {
    constructor() {}
  
    async evaluation(input, output, code) {
      const url = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*';
      const options = {
        method: 'POST',
        headers: {
          'x-rapidapi-key': 'f8aa1dc04dmshb2c71cde8f04062p1e6a0ajsnd9862ee527e2',
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
        if (result.token) {
          await this.getSubmission(result.token);
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
          'x-rapidapi-key': 'f8aa1dc04dmshb2c71cde8f04062p1e6a0ajsnd9862ee527e2',
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
      };
  
      try {
        const response = await fetch(url2, options2);
        const result = await response.json();
        if (result.stdout && result.expected_output) {
          const decodedStdout = Buffer.from(result.stdout, 'base64').toString('utf-8');
          const decodedExpectedOutput = Buffer.from(result.expected_output, 'base64').toString('utf-8');
          console.log("Your code's output:", decodedStdout);
          console.log("Expected output:", decodedExpectedOutput);
        } else {
          console.log("Submission status:", result.status.description);
        }
      } catch (error) {
        console.error("Error during result retrieval:", error);
      }
    }
  }

  module.exports = CodeSubmission;
  