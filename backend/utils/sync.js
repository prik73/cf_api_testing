import Student from '../models/Student.js';
import Submission from '../models/Submission.js';
import ContestParticipation from '../models/ContestParticipation.js';
import {getUserInfo, getUserSubmissions,getUserRating} from './codeforcesAPI.js';


export async function syncStudentData(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');

    console.log(`Syncing data for ${student.cfHandle}...`);

    // Get user info and rating
    const userInfo = await getUserInfo(student.cfHandle);
    if (userInfo.status === 'OK') {
      const user = userInfo.result[0];
      student.currentRating = user.rating || 0;
      student.maxRating = user.maxRating || 0;
    }

    // Get submissions
    const submissions = await getUserSubmissions(student.cfHandle);
    if (submissions.status === 'OK') {
      // Clear old submissions for this student
      await Submission.deleteMany({ studentId: student._id });

      // Insert new submissions
      const submissionData = submissions.result.map(sub => ({
        studentId: student._id,
        cfSubmissionId: sub.id,
        contestId: sub.contestId,
        problem: {
          name: sub.problem.name,
          rating: sub.problem.rating,
          tags: sub.problem.tags
        },
        verdict: sub.verdict,
        timestamp: new Date(sub.creationTimeSeconds * 1000),
        programmingLanguage: sub.programmingLanguage
      }));

      await Submission.insertMany(submissionData);
    }

    // Get contest history
    const ratingHistory = await getUserRating(student.cfHandle);
    if (ratingHistory.status === 'OK') {
      // Clear old contest participations
      await ContestParticipation.deleteMany({ studentId: student._id });

      // Insert new contest participations
      const contestData = ratingHistory.result.map(contest => ({
        studentId: student._id,
        contestId: contest.contestId,
        contestName: contest.contestName,
        rank: contest.rank,
        oldRating: contest.oldRating,
        newRating: contest.newRating,
        ratingChange: contest.newRating - contest.oldRating,
        timestamp: new Date(contest.ratingUpdateTimeSeconds * 1000)
      }));

      await ContestParticipation.insertMany(contestData);
    }

    student.lastSync = new Date();
    await student.save();

    console.log(`✅ Sync completed for ${student.cfHandle}`);
    return { success: true, message: 'Sync completed successfully' };

  } catch (error) {
    console.error('Sync error:', error.message);
    return { success: false, error: error.message };
  }
}

export default syncStudentData