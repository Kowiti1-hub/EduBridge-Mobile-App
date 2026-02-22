
import { LessonContent } from './types';

export const LESSON_DATA: Record<string, Record<number, LessonContent>> = {
  'ps-colors': {
    1: { 
      title: "The Color Red", 
      theory: "Red is a bright color. Apples and strawberries are red.", 
      question: "Name one red fruit.",
      test: {
        question: "Which of these is red?",
        options: ["Banana", "Apple", "Leaf", "Sky"],
        correctAnswer: 1
      }
    }
  },
  'ps-numbers': {
    1: { 
      title: "Counting to 3", 
      theory: "One, Two, Three. You have two eyes and one nose.", 
      question: "How many fingers are you holding up?",
      test: {
        question: "What comes after Two?",
        options: ["One", "Four", "Three", "Zero"],
        correctAnswer: 2
      }
    }
  },
  'el-reading': {
    1: { 
      title: "Phonics: The Letter A", 
      theory: "A is for Apple. It makes an 'ah' sound.", 
      question: "What sound does 'A' make?",
      test: {
        question: "Which word starts with A?",
        options: ["Ball", "Cat", "Ant", "Dog"],
        correctAnswer: 2
      }
    }
  },
  'el-math': {
    1: { 
      title: "Simple Addition", 
      theory: "1 + 1 = 2. If you have one candy and get another, you have two.", 
      question: "What is 2 + 1?",
      test: {
        question: "1 + 2 = ?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1
      }
    }
  },
  'pr-science': {
    1: { 
      title: "Photosynthesis", 
      theory: "Plants use sunlight to make food. This is called photosynthesis.", 
      question: "What do plants need to make food?",
      test: {
        question: "What is the process plants use to make food?",
        options: ["Eating", "Photosynthesis", "Sleeping", "Running"],
        correctAnswer: 1
      }
    }
  },
  'pr-history': {
    1: { 
      title: "Ancient Mesopotamia", 
      theory: "The 'Cradle of Civilization' between the Tigris and Euphrates rivers.", 
      question: "Where was Mesopotamia located?",
      test: {
        question: "Mesopotamia was between which two rivers?",
        options: ["Nile and Amazon", "Tigris and Euphrates", "Ganges and Indus", "Mississippi and Missouri"],
        correctAnswer: 1
      }
    }
  },
  'sc-physics': {
    1: { 
      title: "Newton's First Law", 
      theory: "An object at rest stays at rest unless acted upon by a force.", 
      question: "What is inertia?",
      test: {
        question: "Newton's First Law is also known as the Law of:",
        options: ["Gravity", "Inertia", "Motion", "Energy"],
        correctAnswer: 1
      }
    }
  },
  'sc-literature': {
    1: { 
      title: "Shakespeare's Sonnets", 
      theory: "William Shakespeare wrote 154 sonnets, mostly about love and time.", 
      question: "How many sonnets did Shakespeare write?",
      test: {
        question: "A Shakespearean sonnet has how many lines?",
        options: ["10", "12", "14", "16"],
        correctAnswer: 2
      }
    }
  },
  'sc-economics': {
    1: { 
      title: "Supply and Demand", 
      theory: "When supply goes down and demand goes up, prices usually rise.", 
      question: "What happens to price when demand increases?",
      test: {
        question: "If there is too much of a product (high supply), what usually happens to the price?",
        options: ["It goes up", "It stays the same", "It goes down", "It disappears"],
        correctAnswer: 2
      }
    }
  },
  'tr-compsci': {
    1: { 
      title: "Binary System", 
      theory: "Computers use 0 and 1 to represent all data.", 
      question: "What is binary?",
      test: {
        question: "The binary number 10 in decimal is:",
        options: ["1", "2", "3", "4"],
        correctAnswer: 1
      }
    }
  },
  'tr-nursing': {
    1: { 
      title: "Vital Signs", 
      theory: "Temperature, pulse, respiration, and blood pressure are key indicators of health.", 
      question: "Name the four main vital signs.",
      test: {
        question: "Which of these is NOT a standard vital sign?",
        options: ["Pulse", "Blood Pressure", "Eye Color", "Respiration"],
        correctAnswer: 2
      }
    }
  },
  'tr-engineering': {
    1: { 
      title: "Stress and Strain", 
      theory: "Stress is force per unit area; strain is the deformation resulting from stress.", 
      question: "Define stress in engineering terms.",
      test: {
        question: "The ratio of stress to strain is called:",
        options: ["Young's Modulus", "Gravity", "Density", "Volume"],
        correctAnswer: 0
      }
    }
  },
  'tr-carpentry': {
    1: { 
      title: "Wood Types", 
      theory: "Hardwoods come from deciduous trees; softwoods come from conifers.", 
      question: "What is the difference between hardwood and softwood?",
      test: {
        question: "Which of these is a common hardwood?",
        options: ["Pine", "Oak", "Cedar", "Spruce"],
        correctAnswer: 1
      }
    }
  },
  'tr-marketing': {
    1: { 
      title: "The 4 Ps of Marketing", 
      theory: "Product, Price, Place, and Promotion are the core of marketing strategy.", 
      question: "List the 4 Ps.",
      test: {
        question: "Which 'P' refers to where the product is sold?",
        options: ["Product", "Price", "Place", "Promotion"],
        correctAnswer: 2
      }
    }
  }
};
