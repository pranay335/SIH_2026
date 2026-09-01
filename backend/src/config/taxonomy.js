/**
 * CivicMind — Canonical Municipal Defect Taxonomy
 * Single Source of Truth for defect classification, departments, operational actions, and validation.
 */

const DEFECT_TAXONOMY = Object.freeze({
  potholes_and_roadcracks: Object.freeze({
    classId: 'potholes_and_roadcracks',
    displayName: 'Potholes and Road Cracks',
    department: 'Roads',
    operationalAction: 'Asphalt patching, road surface resurfacing, and fissure sealing',
    description: 'Potholes, surface cracks, crumbling asphalt, and road craters on public thoroughfares.',
    examples: [
      'Deep pothole on main road causing vehicle slow down',
      'Crumbling asphalt surface with severe cracking',
      'Large fissure across road lane after rainfall'
    ],
    severityHints: Object.freeze({
      Low: 'Minor hairline surface cracks or shallow depression under 2 inches deep',
      Medium: 'Pothole 2 to 5 inches deep spanning part of a driving lane',
      High: 'Deep crater over 5 inches deep or multiple severe potholes causing immediate vehicle damage or accident hazard'
    })
  }),

  footpath_split: Object.freeze({
    classId: 'footpath_split',
    displayName: 'Footpath and Paver Block Damage',
    department: 'Roads',
    operationalAction: 'Pedestrian walkway repair, paver block relaying, and curb restoration',
    description: 'Broken, displaced, or missing paver blocks, cracked sidewalks, and damaged curbs.',
    examples: [
      'Missing paver blocks on pedestrian walkway',
      'Broken concrete sidewalk slab creating tripping hazard',
      'Displaced curb stones sticking out into pedestrian path'
    ],
    severityHints: Object.freeze({
      Low: 'Slightly loose or uneven paver block',
      Medium: 'Multiple missing or broken blocks creating tripping hazard',
      High: 'Collapsed footpath slab or major trench on pedestrian walkway near heavy foot traffic'
    })
  }),

  damagedroadsigns: Object.freeze({
    classId: 'damagedroadsigns',
    displayName: 'Damaged or Missing Road Signs',
    department: 'Traffic / Roads',
    operationalAction: 'Replacement, re-anchoring, or realignment of traffic signage and signals',
    description: 'Bent, faded, broken, or missing traffic direction signs, signal boards, and street names.',
    examples: [
      'Bent stop sign post at busy intersection',
      'Faded speed limit and warning sign',
      'Fallen street name board lying on ground'
    ],
    severityHints: Object.freeze({
      Low: 'Faded text or sticker on informational signage',
      Medium: 'Bent sign post still partially visible',
      High: 'Missing or destroyed critical regulatory sign (Stop, One-Way, Danger Ahead) at major intersection'
    })
  }),

  garbage_and_dumping: Object.freeze({
    classId: 'garbage_and_dumping',
    displayName: 'Unattended Garbage and Open Dumping',
    department: 'Solid Waste Management',
    operationalAction: 'Solid waste clearance, bin emptying, and site sanitation',
    description: 'Accumulated household waste, overflowing community bins, open dumping on roadsides, and plastic debris.',
    examples: [
      'Overflowing municipal trash bin spilling onto street',
      'Illegal dumping of commercial waste on vacant plot',
      'Uncollected household garbage pile near market area'
    ],
    severityHints: Object.freeze({
      Low: 'Small pile of dry litter near bin',
      Medium: 'Overflowing municipal bin with waste spreading on sidewalk',
      High: 'Massive illegal open dump blocking road/pathway with foul odor and health hazard'
    })
  }),

  deadanimalspollution: Object.freeze({
    classId: 'deadanimalspollution',
    displayName: 'Dead Animals and Bio-Hazard Pollution',
    department: 'SWM / Public Health',
    operationalAction: 'Sanitary animal carcass removal, disinfection, and bio-hazard spray',
    description: 'Dead animals, rotting organic material, and severe bio-hazardous waste accumulation.',
    examples: [
      'Dead stray animal lying on public road',
      'Decomposing animal carcass near residential colony',
      'Bio-hazardous waste dumped near public park'
    ],
    severityHints: Object.freeze({
      Low: 'Small animal carcass in isolated corner',
      Medium: 'Decomposing carcass on pedestrian sidewalk',
      High: 'Large animal carcass on main road or near water body causing severe bio-hazard and stench'
    })
  }),

  drainage_waterlogging: Object.freeze({
    classId: 'drainage_waterlogging',
    displayName: 'Drainage Clog and Monsoon Waterlogging',
    department: 'Storm Water Drains',
    operationalAction: 'Drain desilting, storm drain unclogging, and pump deployment',
    description: 'Blocked storm drains, overflowing gutters, standing water on streets, and monsoon flooding.',
    examples: [
      'Stagnant waterlogging covering road intersection',
      'Clogged roadside drain inlet with debris',
      'Overflowing gutter water spreading across street'
    ],
    severityHints: Object.freeze({
      Low: 'Minor standing water puddle near curb',
      Medium: 'Ankle-deep water logging blocking pedestrian movement',
      High: 'Severe flooding covering entire roadway or entering adjacent buildings'
    })
  }),

  damagedelectricalpoles: Object.freeze({
    classId: 'damagedelectricalpoles',
    displayName: 'Damaged or Tilted Electrical Poles',
    department: 'Street Lighting / MSEDCL',
    operationalAction: 'Pole stabilization, structural replacement, and power line isolation',
    description: 'Leaning, rusted, cracked, or collision-damaged electric and street light poles.',
    examples: [
      'Tilted utility pole leaning dangerously over road',
      'Severely rusted base on metal street lamp post',
      'Cracked concrete electric pole after vehicle crash'
    ],
    severityHints: Object.freeze({
      Low: 'Minor surface rust on pole base without structural weakness',
      Medium: 'Noticeably tilted pole leaning away from structures',
      High: 'Severely cracked or leaning pole at immediate risk of collapsing onto road or buildings'
    })
  }),

  wire_and_lighting_hazards: Object.freeze({
    classId: 'wire_and_lighting_hazards',
    displayName: 'Dangling Wires and Lighting Hazards',
    department: 'Street Lighting',
    operationalAction: 'Live wire insulation, cabling bunding, and street light fixture repair',
    description: 'Exposed live electrical wires, dangling cables, non-functioning street lights at night, and open junction boxes.',
    examples: [
      'Dangling electric wire hanging low near sidewalk',
      'Open electrical junction box with exposed wiring',
      'Dark street with entire row of non-working street lamps'
    ],
    severityHints: Object.freeze({
      Low: 'Single non-functional street lamp in well-lit area',
      Medium: 'Dark street stretch due to unlit lamps or loose low-hanging communication cable',
      High: 'Bare live electrical wire hanging near ground/water or open junction box accessible to children'
    })
  }),

  pipeline_leaks: Object.freeze({
    classId: 'pipeline_leaks',
    displayName: 'Water Supply Pipeline Leaks and Bursts',
    department: 'Hydraulic Engineer',
    operationalAction: 'Pipe valve isolation, leak patching, and main pipeline replacement',
    description: 'Gushing clean water main leaks, leaking municipal supply lines, and broken valves.',
    examples: [
      'Burst water main gushing clean water into street',
      'Continuous leak from underground municipal supply pipe',
      'Broken water supply valve leaking continuously'
    ],
    severityHints: Object.freeze({
      Low: 'Slow drip from municipal supply pipe joint',
      Medium: 'Steady stream of leaking water filling roadside gutter',
      High: 'High-pressure water main burst flooding street and wasting massive volume of drinking water'
    })
  }),

  damaged_concrete_structures: Object.freeze({
    classId: 'damaged_concrete_structures',
    displayName: 'Damaged Bridges and Concrete Structures',
    department: 'Bridges / Maintenance',
    operationalAction: 'Structural engineering assessment, spalling repair, and safety scaffolding',
    description: 'Exposed rebar, spalling concrete, cracked bridge pillars, damaged flyover railings, and culvert defects.',
    examples: [
      'Cracked flyover pillar with crumbling concrete',
      'Chipped concrete and broken railing on public bridge',
      'Exposed rusted steel rebar on culvert wall'
    ],
    severityHints: Object.freeze({
      Low: 'Minor surface concrete chipping or cosmetic cracks',
      Medium: 'Exposed rebar or damaged bridge protective railing',
      High: 'Deep structural crack on bridge load-bearing pillar or flyover slab deck'
    })
  }),

  fallentrees: Object.freeze({
    classId: 'fallentrees',
    displayName: 'Fallen Trees and Dangerous Overhanging Branches',
    department: 'Tree Authority / Gardens',
    operationalAction: 'Tree cutting, wood removal, and dangerous branch pruning',
    description: 'Fallen trees, uprooted trunks blocking roads, and broken heavy branches leaning on utility lines or structures.',
    examples: [
      'Large fallen tree blocking entire road lane after heavy winds',
      'Heavy broken branch dangling precariously over sidewalk',
      'Uprooted tree leaning against overhead utility cables'
    ],
    severityHints: Object.freeze({
      Low: 'Small fallen branch resting on roadside shoulder',
      Medium: 'Medium branch obstructing half of pedestrian path or single lane',
      High: 'Large tree uprooted across major road or crushing power lines/vehicles'
    })
  }),

  graffitti_and_vandalism: Object.freeze({
    classId: 'graffitti_and_vandalism',
    displayName: 'Graffiti, Unauthorized Posters, and Public Vandalism',
    department: 'License / Maintenance',
    operationalAction: 'Poster removal, wall repainting, and civic property restoration',
    description: 'Illegal banners, posters on public walls, unauthorized graffiti, and damaged public benches or monuments.',
    examples: [
      'Defaced public heritage wall with illegal paper posters',
      'Spray-painted graffiti on municipal building facade',
      'Vandalized public park bench and smashed trash bin'
    ],
    severityHints: Object.freeze({
      Low: 'Small paper flyer or poster pasted on public wall',
      Medium: 'Multiple illegal banners or spray graffiti across public wall',
      High: 'Extensive defacement of heritage structures, directional signage, or critical public installations'
    })
  }),

  illegalparking_obstruction: Object.freeze({
    classId: 'illegalparking_obstruction',
    displayName: 'Illegal Parking and Encroachment Obstruction',
    department: 'Anti-Encroachment / Traffic',
    operationalAction: 'Vehicle towing, encroachment clearance, and traffic clearance',
    description: 'Vehicles parked illegally blocking gates or lanes, abandoned vehicles, and hawker encroachments on footpaths.',
    examples: [
      'Abandoned vehicle parked permanently blocking narrow lane',
      'Illegal parking blocking hospital entrance or fire hydrant',
      'Unauthorized commercial stalls completely encroaching sidewalk'
    ],
    severityHints: Object.hidden || Object.freeze({
      Low: 'Vehicle parked slightly beyond marked parking bay',
      Medium: 'Double-parked vehicle slowing down lane traffic or sidewalk stall narrowing pedestrian path',
      High: 'Vehicle or commercial encroachment completely blocking emergency response access, gate, or major road'
    })
  })
});

/**
 * List of all 13 canonical class IDs for fast lookup
 */
const CANONICAL_CLASS_IDS = Object.freeze(Object.keys(DEFECT_TAXONOMY));

/**
 * Validates if a class ID belongs to the 13 canonical defect classes.
 * @param {string} classId
 * @returns {boolean}
 */
const isValidClassId = (classId) => {
  if (!classId || typeof classId !== 'string') return false;
  return Object.prototype.hasOwnProperty.call(DEFECT_TAXONOMY, classId.trim().toLowerCase());
};

/**
 * Validates AI classification result against the canonical 13-class taxonomy.
 * Throws or returns an error object if the class is outside the 13 allowed classes.
 * @param {string} classId
 * @returns {{ valid: boolean, error?: string, defectClass?: Object }}
 */
const validateAiClass = (classId) => {
  if (!classId || typeof classId !== 'string') {
    return {
      valid: false,
      error: 'Defect class ID is missing or not a string.'
    };
  }

  const normalized = classId.trim().toLowerCase();

  if (!isValidClassId(normalized)) {
    return {
      valid: false,
      error: `Invalid defect class '${classId}'. Must be one of the 13 canonical classes: [${CANONICAL_CLASS_IDS.join(', ')}].`
    };
  }

  return {
    valid: true,
    defectClass: DEFECT_TAXONOMY[normalized]
  };
};

/**
 * Retrieves full defect class metadata object by classId.
 * @param {string} classId
 * @returns {Object|null}
 */
const getDefectClass = (classId) => {
  if (!isValidClassId(classId)) return null;
  return DEFECT_TAXONOMY[classId.trim().toLowerCase()];
};

/**
 * Retrieves all 13 canonical defect class metadata objects.
 * @returns {Array<Object>}
 */
const getAllDefectClasses = () => {
  return Object.values(DEFECT_TAXONOMY);
};

/**
 * Returns official municipal department name for a defect class.
 * @param {string} classId
 * @returns {string}
 */
const mapClassToDepartment = (classId) => {
  const defect = getDefectClass(classId);
  return defect ? defect.department : 'General';
};

/**
 * Maps a defect classId to the backend's internal normalized employee assignment department enum:
 * ['Roads', 'Waste', 'Water', 'Electricity', 'Health', 'Drainage', 'General']
 * @param {string} classId
 * @returns {string}
 */
const mapClassToNormalizedDepartment = (classId) => {
  const routingResolver = require('./routingResolver');
  return routingResolver.resolveRoutingForClass(classId).primaryEmployeeEnum;
};

module.exports = {
  DEFECT_TAXONOMY,
  CANONICAL_CLASS_IDS,
  isValidClassId,
  validateAiClass,
  getDefectClass,
  getAllDefectClasses,
  mapClassToDepartment,
  mapClassToNormalizedDepartment
};
