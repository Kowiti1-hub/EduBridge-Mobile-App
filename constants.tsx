import React from 'react';
import { Subject, LearningStage } from './types';

export const SUBJECTS: Subject[] = [
  // Pre-School
  { id: 'ps-colors', title: 'Colors & Shapes', icon: '🎨', description: 'Basic identification of colors and geometric shapes.', stage: LearningStage.PRE_SCHOOL },
  { id: 'ps-numbers', title: 'Counting 1-10', icon: '🔢', description: 'Introduction to numbers and basic counting.', stage: LearningStage.PRE_SCHOOL },
  
  // Elementary
  { id: 'el-reading', title: 'Early Reading', icon: '📖', description: 'Phonics and simple sentence construction.', stage: LearningStage.ELEMENTARY },
  { id: 'el-math', title: 'Basic Arithmetic', icon: '➕', description: 'Addition and subtraction for beginners.', stage: LearningStage.ELEMENTARY },
  
  // Primary
  { id: 'pr-science', title: 'Natural Science', icon: '🌱', description: 'Plants, animals, and the environment.', stage: LearningStage.PRIMARY },
  { id: 'pr-history', title: 'World History', icon: '📜', description: 'Ancient civilizations and key historical events.', stage: LearningStage.PRIMARY },
  
  // Secondary
  { id: 'sc-physics', title: 'Physics', icon: '⚛️', description: 'Mechanics, energy, and matter.', stage: LearningStage.SECONDARY },
  { id: 'sc-literature', title: 'World Literature', icon: '✍️', description: 'Classic novels and literary analysis.', stage: LearningStage.SECONDARY },
  { id: 'sc-economics', title: 'Economics', icon: '📉', description: 'Supply, demand, and global markets.', stage: LearningStage.SECONDARY },
  
  // Tertiary (University/College/TVET)
  { id: 'tr-compsci', title: 'Computer Science', icon: '💻', description: 'Programming, algorithms, and data structures.', stage: LearningStage.TERTIARY },
  { id: 'tr-nursing', title: 'Nursing & Health', icon: '🩺', description: 'Patient care, anatomy, and medical ethics.', stage: LearningStage.TERTIARY },
  { id: 'tr-engineering', title: 'Civil Engineering', icon: '🏗️', description: 'Infrastructure design and structural analysis.', stage: LearningStage.TERTIARY },
  { id: 'tr-carpentry', title: 'Carpentry (TVET)', icon: '🔨', description: 'Woodworking, construction, and safety.', stage: LearningStage.TERTIARY },
  { id: 'tr-marketing', title: 'Digital Marketing', icon: '📱', description: 'SEO, social media, and brand strategy.', stage: LearningStage.TERTIARY }
];

export const USSD_MENU = `
WELCOME TO EDUBRIDGE
Reply with number:
1. Pre-School
2. Elementary
3. Primary
4. Secondary
5. Tertiary (Uni/College/TVET)
0. Help
`;

export const HELP_MESSAGE = `
EDUBRIDGE HELP CENTER
---------------------
COMMANDS:
*123# - Main Menu
*5#  - Attachment Menu
*2#  - Previous Lesson
0 or *0# - This Help Guide
"Next" - Continue lesson
"Menu" - Return to subjects

HOW TO USE:
1. Select your learning stage.
2. Choose a subject.
3. Complete lessons and tests.
4. Use voice button for audio.

EduBridge works on low-signal 2G/3G networks.
`;
