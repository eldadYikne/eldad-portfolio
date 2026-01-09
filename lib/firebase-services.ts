import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Project, WorkExperience, Skill } from "@/types";

// Collections
const COLLECTIONS = {
  PROJECTS: "projects",
  WORK_EXPERIENCE: "workExperience",
  SKILLS: "skills",
};

// ============================================
// PROJECTS
// ============================================

export async function getProjects(featuredOnly: boolean = false) {
  try {
    const constraints: QueryConstraint[] = [orderBy("order", "asc")];

    if (featuredOnly) {
      constraints.unshift(where("featured", "==", true));
    }

    const q = query(collection(db, COLLECTIONS.PROJECTS), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data: any = doc.data();

      // Firestore Timestamp -> ISO string
      const toIsoOrNull = (v: any) =>
        typeof v?.toDate === "function" ? v.toDate().toISOString() : null;

      // אם זה מגיע כ- {seconds, nanoseconds}
      const fromSecondsToIsoOrNull = (v: any) =>
        typeof v?.seconds === "number"
          ? new Date(v.seconds * 1000).toISOString()
          : null;

      const createdAt =
        toIsoOrNull(data.createdAt) ?? fromSecondsToIsoOrNull(data.createdAt);

      const updatedAt =
        toIsoOrNull(data.updatedAt) ?? fromSecondsToIsoOrNull(data.updatedAt);

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
      };
    }) as Project[];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}
export async function getProjectBySlug(slug: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PROJECTS),
      where("slug", "==", slug)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docData = querySnapshot.docs[0];
    return {
      id: docData.id,
      ...docData.data(),
    } as Project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function createProject(projectData: Omit<Project, "id">) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
      ...projectData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

export async function updateProject(id: string, projectData: Partial<Project>) {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    await updateDoc(docRef, {
      ...projectData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

export async function deleteProject(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

// ============================================
// WORK EXPERIENCE
// ============================================

export async function getWorkExperiences() {
  try {
    const q = query(
      collection(db, COLLECTIONS.WORK_EXPERIENCE),
      orderBy("startDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    const experiences: WorkExperience[] = [];

    querySnapshot.forEach((doc) => {
      experiences.push({
        id: doc.id,
        ...doc.data(),
      } as WorkExperience);
    });

    return experiences;
  } catch (error) {
    console.error("Error fetching work experiences:", error);
    return [];
  }
}

export async function createWorkExperience(data: Omit<WorkExperience, "id">) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.WORK_EXPERIENCE), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating work experience:", error);
    throw error;
  }
}

export async function updateWorkExperience(
  id: string,
  data: Partial<WorkExperience>
) {
  try {
    const docRef = doc(db, COLLECTIONS.WORK_EXPERIENCE, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating work experience:", error);
    throw error;
  }
}

export async function deleteWorkExperience(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.WORK_EXPERIENCE, id));
  } catch (error) {
    console.error("Error deleting work experience:", error);
    throw error;
  }
}

// ============================================
// SKILLS
// ============================================

export async function getSkills() {
  try {
    const q = query(
      collection(db, COLLECTIONS.SKILLS),
      orderBy("category", "asc")
    );

    const querySnapshot = await getDocs(q);
    const skills: Skill[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Skill[];

    // Sort by order within each category client-side
    return skills.sort((a, b) => {
      if (a.category === b.category) {
        return (a.order || 0) - (b.order || 0);
      }
      return a.category.localeCompare(b.category);
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return [];
  }
}

export async function getSkillsByCategory(category: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.SKILLS),
      where("category", "==", category),
      orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(q);
    const skills: Skill[] = [];

    querySnapshot.forEach((doc) => {
      skills.push({
        id: doc.id,
        ...doc.data(),
      } as Skill);
    });

    return skills;
  } catch (error) {
    console.error("Error fetching skills by category:", error);
    return [];
  }
}

export async function createSkill(data: Omit<Skill, "id">) {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SKILLS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating skill:", error);
    throw error;
  }
}

export async function updateSkill(id: string, data: Partial<Skill>) {
  try {
    const docRef = doc(db, COLLECTIONS.SKILLS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating skill:", error);
    throw error;
  }
}

export async function deleteSkill(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SKILLS, id));
  } catch (error) {
    console.error("Error deleting skill:", error);
    throw error;
  }
}
