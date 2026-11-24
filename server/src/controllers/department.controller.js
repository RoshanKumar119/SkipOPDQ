const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const { ApiError, asyncHandler } = require('../utils/errors');

function pickDepartment(body = {}) {
  const data = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.location !== undefined) data.location = String(body.location).trim();
  return data;
}

/** GET /api/departments – public list with doctor counts. */
exports.list = asyncHandler(async (req, res) => {
  const [departments, counts] = await Promise.all([
    Department.find().sort({ name: 1 }).lean(),
    Doctor.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(departments.map((d) => ({ ...d, doctorCount: countMap.get(String(d._id)) || 0 })));
});

/** POST /api/departments (admin) */
exports.create = asyncHandler(async (req, res) => {
  const data = pickDepartment(req.body);
  if (!data.name) throw new ApiError(400, 'Department name is required');
  const exists = await Department.findOne({ name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (exists) throw new ApiError(409, 'A department with this name already exists');
  const department = await Department.create(data);
  res.status(201).json(department);
});

/** PUT /api/departments/:id (admin) */
exports.update = asyncHandler(async (req, res) => {
  const data = pickDepartment(req.body);
  if (data.name === '') throw new ApiError(400, 'Department name cannot be empty');
  const department = await Department.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!department) throw new ApiError(404, 'Department not found');
  res.json(department);
});

// TODO: Phase 2 – delete/merge departments (needs re-assigning doctors and historical appointments)
