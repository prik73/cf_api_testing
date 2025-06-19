import express from 'express'
const router = express.Router();
import * as  controller from '../controllers/studentController.js'

router.get('/', controller.getAllStudents);
router.post('/', controller.createStudentValidation, controller.createStudent);
router.put('/:id', controller.createStudentValidation, controller.updateStudent);
router.delete('/:id', controller.deleteStudent);
router.get('/:id/profile', controller.getStudentProfile);
router.post('/:id/sync', controller.manualSync);
router.get('/export/csv', controller.exportCSV);

export default router