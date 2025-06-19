// utils/codeforcesAPI.js
import axios from 'axios';

export async function getUserInfo(handle) {
  try {
    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    return response.data;
  } catch (error) {
    const cfError = error.response?.data?.comment || error.message;
    console.error(`Error fetching user info for ${handle}: ${cfError}`);
    throw new Error(cfError);
  }
}

export async function getUserSubmissions(handle) {
  try {
    const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching submissions for ${handle}:`, error.message);
    throw error;
  }
}

export async function getUserRating(handle) {
  try {
    const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching rating for ${handle}:`, error.message);
    throw error;
  }
}

export async function getContestList() {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list');
    return response.data;
  } catch (error) {
    console.error('Error fetching contest list:', error.message);
    throw error;
  }
}

export async function getContestStandings(contestId, handle) {
  try {
    const response = await axios.get(
      `https://codeforces.com/api/contest.standings?contestId=${contestId}&handles=${handle}&showUnofficial=true`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching contest standings for ${contestId}:`, error.message);
    throw error;
  }
}

// NEW: Get contest problems
export async function getContestProblems(contestId) {
  try {
    const response = await axios.get(
      `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`
    );
    
    if (response.data.status === 'OK') {
      return {
        status: 'OK',
        result: {
          problems: response.data.result.problems || []
        }
      };
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching contest problems for ${contestId}:`, error.message);
    throw error;
  }
}
