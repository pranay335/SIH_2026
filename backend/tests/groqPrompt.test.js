const groqPrompt = require('../src/config/groqPrompt');
const taxonomy = require('../src/config/taxonomy');

describe('Groq Classification Prompt Module', () => {
  test('buildSystemPrompt should return comprehensive system prompt containing all 13 classes', () => {
    const prompt = groqPrompt.buildSystemPrompt();

    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('Mumbai Metropolitan Region (MMR)');
    expect(prompt).toContain('ALLOWED 13 CANONICAL DEFECT CLASSES');

    // Check that all 13 canonical class IDs are mentioned
    taxonomy.CANONICAL_CLASS_IDS.forEach((classId) => {
      expect(prompt).toContain(classId);
    });

    // Check for critical discrimination directives
    expect(prompt).toContain('potholes_and_roadcracks');
    expect(prompt).toContain('footpath_split');
    expect(prompt).toContain('damagedelectricalpoles');
    expect(prompt).toContain('wire_and_lighting_hazards');
    expect(prompt).toContain('garbage_and_dumping');
    expect(prompt).toContain('deadanimalspollution');
    expect(prompt).toContain('drainage_waterlogging');
    expect(prompt).toContain('pipeline_leaks');
    expect(prompt).toContain('graffitti_and_vandalism');
    expect(prompt).toContain('illegalparking_obstruction');
    expect(prompt).toContain('LOW');
    expect(prompt).toContain('MEDIUM');
    expect(prompt).toContain('HIGH');
    expect(prompt).toContain('CRITICAL');
  });

  test('buildUserContent should correctly format message content for vision vs text models', () => {
    const sampleMeta = { dataUrl: 'data:image/jpeg;base64,ABCDEF==', sizeBytes: 10240 };

    // Test text model formatting
    const textContent = groqPrompt.buildUserContent({
      description: 'Water leaking from broken pipe',
      imageMeta: sampleMeta,
      address: 'Station Road, Thane',
      municipalityCode: 'TMC',
      isVisionModel: false
    });

    expect(typeof textContent).toBe('string');
    expect(textContent).toContain('Water leaking from broken pipe');
    expect(textContent).toContain('Station Road, Thane');
    expect(textContent).toContain('TMC');
    expect(textContent).toContain('10.0 KB');

    // Test vision model formatting
    const visionContent = groqPrompt.buildUserContent({
      description: 'Water leaking from broken pipe',
      imageMeta: sampleMeta,
      address: 'Station Road, Thane',
      municipalityCode: 'TMC',
      isVisionModel: true
    });

    expect(Array.isArray(visionContent)).toBe(true);
    expect(visionContent.length).toBe(2);
    expect(visionContent[0].type).toBe('text');
    expect(visionContent[0].text).toContain('Water leaking from broken pipe');
    expect(visionContent[1].type).toBe('image_url');
    expect(visionContent[1].image_url.url).toBe(sampleMeta.dataUrl);
  });
});
