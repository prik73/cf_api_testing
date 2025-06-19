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
