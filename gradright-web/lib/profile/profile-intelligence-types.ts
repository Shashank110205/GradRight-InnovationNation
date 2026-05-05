export type ClarityLevel = "high" | "medium" | "low";

export type ProfileIntelligenceExtracurricular = {
  leadership: string[];
  public_service: string[];
  sports: string[];
  achievements: string[];
  hackathons: string[];
};

export type ProfileIntelligenceResume = {
  cgpa: number;
  internships: string[];
  projects: string[];
  research_papers: string[];
  skills: string[];
  extracurricular: ProfileIntelligenceExtracurricular;
};

export type ProfileIntelligenceGoals = {
  five_year_goal: string;
  target_role: string;
  domain: string;
  clarity: ClarityLevel;
};

/** Strict contract for `user_metadata.profile_intelligence`. */
export type ProfileIntelligence = {
  resume: {
    cgpa: number;
    internships: string[];
    projects: string[];
    research_papers: string[];
    skills: string[];
    extracurricular: {
      leadership: string[];
      public_service: string[];
      sports: string[];
      achievements: string[];
      hackathons: string[];
    };
  };
  goals: {
    five_year_goal: string;
    target_role: string;
    domain: string;
    clarity: ClarityLevel;
  };
};

export const EMPTY_EXTRACURRICULAR: ProfileIntelligenceExtracurricular = {
  leadership: [],
  public_service: [],
  sports: [],
  achievements: [],
  hackathons: [],
};

export const emptyProfileIntelligence = (): ProfileIntelligence => ({
  resume: {
    cgpa: 0,
    internships: [],
    projects: [],
    research_papers: [],
    skills: [],
    extracurricular: { ...EMPTY_EXTRACURRICULAR },
  },
  goals: {
    five_year_goal: "",
    target_role: "",
    domain: "",
    clarity: "low",
  },
});
