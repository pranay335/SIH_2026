/**
 * CivicMind — Municipal Routing Resolver & Employee Compatibility Module
 * Maps 13 canonical defect classes to official municipal departments
 * and provides backward-compatible queries for existing employee database schema.
 */

const taxonomy = require('./taxonomy');

/**
 * Single Source of Truth: Deterministic 13-Class Municipal Department Routing Table
 */
const MUNICIPAL_ROUTING_MAP = Object.freeze({
  potholes_and_roadcracks: 'Roads',
  footpath_split: 'Roads',
  damagedroadsigns: 'Traffic / Roads',
  garbage_and_dumping: 'Solid Waste Management',
  deadanimalspollution: 'SWM / Public Health',
  drainage_waterlogging: 'Storm Water Drains',
  damagedelectricalpoles: 'Street Lighting / MSEDCL',
  wire_and_lighting_hazards: 'Street Lighting',
  pipeline_leaks: 'Hydraulic Engineer',
  damaged_concrete_structures: 'Bridges / Maintenance',
  fallentrees: 'Tree Authority / Gardens',
  graffitti_and_vandalism: 'License / Maintenance',
  illegalparking_obstruction: 'Anti-Encroachment / Traffic'
});

/**
 * Compatibility Mapping between Official Municipal Departments and existing
 * Employee User.department enum ['Water', 'Roads', 'Waste', 'Electricity', 'Health', 'General', 'Drainage']
 */
const EMPLOYEE_DEPT_COMPATIBILITY = Object.freeze({
  'Roads': ['Roads', 'Road', 'roads', 'road', 'Road & Infrastructure'],
  'Traffic / Roads': ['Roads', 'Road', 'roads', 'road', 'Traffic / Roads'],
  'Solid Waste Management': ['Waste', 'waste', 'Garbage', 'garbage', 'Solid Waste Management'],
  'SWM / Public Health': ['Health', 'health', 'Waste', 'waste', 'SWM / Public Health'],
  'Storm Water Drains': ['Drainage', 'drainage', 'Sewer', 'sewer', 'Storm Water Drains'],
  'Street Lighting / MSEDCL': ['Electricity', 'electricity', 'Electrical', 'electrical', 'Street Lighting / MSEDCL'],
  'Street Lighting': ['Electricity', 'electricity', 'Electrical', 'electrical', 'Street Lighting'],
  'Hydraulic Engineer': ['Water', 'water', 'Hydraulic Engineer'],
  'Bridges / Maintenance': ['Roads', 'Road', 'roads', 'road', 'Bridges / Maintenance', 'General'],
  'Tree Authority / Gardens': ['Health', 'health', 'General', 'general', 'Tree Authority / Gardens'],
  'License / Maintenance': ['General', 'general', 'License / Maintenance'],
  'Anti-Encroachment / Traffic': ['Roads', 'Road', 'roads', 'road', 'General', 'general', 'Anti-Encroachment / Traffic'],
  'General': ['General', 'general']
});

/**
 * Primary legacy enum representation for each official department
 */
const PRIMARY_EMPLOYEE_ENUM_MAP = Object.freeze({
  'Roads': 'Roads',
  'Traffic / Roads': 'Roads',
  'Solid Waste Management': 'Waste',
  'SWM / Public Health': 'Health',
  'Storm Water Drains': 'Drainage',
  'Street Lighting / MSEDCL': 'Electricity',
  'Street Lighting': 'Electricity',
  'Hydraulic Engineer': 'Water',
  'Bridges / Maintenance': 'Roads',
  'Tree Authority / Gardens': 'Health',
  'License / Maintenance': 'General',
  'Anti-Encroachment / Traffic': 'Roads',
  'General': 'General'
});

/**
 * Resolves official municipal routing and employee department query parameters for a canonical defectClass.
 * @param {string} classId - Canonical defect class ID
 * @returns {{
 *   classId: string,
 *   officialDepartment: string,
 *   primaryEmployeeEnum: string,
 *   compatibleEmployeeDepartments: Array<string>
 * }}
 */
const resolveRoutingForClass = (classId) => {
  if (!classId || typeof classId !== 'string') {
    return {
      classId: 'general',
      officialDepartment: 'General',
      primaryEmployeeEnum: 'General',
      compatibleEmployeeDepartments: ['General', 'general']
    };
  }

  const normalized = classId.trim().toLowerCase();
  const officialDepartment = MUNICIPAL_ROUTING_MAP[normalized] || 'General';
  const primaryEmployeeEnum = PRIMARY_EMPLOYEE_ENUM_MAP[officialDepartment] || 'General';
  const compatibleEmployeeDepartments = EMPLOYEE_DEPT_COMPATIBILITY[officialDepartment] || [officialDepartment, 'General'];

  return {
    classId: normalized,
    officialDepartment,
    primaryEmployeeEnum,
    compatibleEmployeeDepartments
  };
};

/**
 * Resolves compatible employee department strings for a given official department.
 * @param {string} officialDept 
 * @returns {Array<string>}
 */
const getCompatibleEmployeeDepartments = (officialDept) => {
  if (!officialDept) return ['General', 'general'];
  return EMPLOYEE_DEPT_COMPATIBILITY[officialDept] || [officialDept, 'General'];
};

module.exports = {
  MUNICIPAL_ROUTING_MAP,
  EMPLOYEE_DEPT_COMPATIBILITY,
  PRIMARY_EMPLOYEE_ENUM_MAP,
  resolveRoutingForClass,
  getCompatibleEmployeeDepartments
};
