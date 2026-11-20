import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { localDevDb } from "@/lib/data/local-dev-store";
import { createDefaultEditorSettings, createEmptyStructuredCv } from "@/lib/cv/defaults";
import { SUPERUSER_EMAILS } from "@/lib/auth/is-superuser";
import type {
  CareerProfile,
  CvAnalysisResult,
  CvEditorSettings,
  CvRecord,
  CvStatus,
  JobTailoringResult,
  StructuredCvContent,
  TemplateId,
} from "@/types/cv";

function mapDbRowToCvRecord(row: Record<string, unknown>): CvRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title || "Untitled CV"),
    careerProfile: (row.career_profile as CareerProfile) || "experienced-professional",
    templateId: (row.template_id as TemplateId) || "classic-professional",
    structuredContent:
      (row.structured_content as StructuredCvContent) || createEmptyStructuredCv(),
    settings:
      (row.settings as CvEditorSettings) || createDefaultEditorSettings(),
    status: (row.status as CvStatus) || "draft",
    parentCvId: row.parent_cv_id ? String(row.parent_cv_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export const cvService = {
  async assertCanCreateCv(
    userId: string,
    user: { email?: string; role?: string; planId?: string | null; maxCvs: number; generatedCvsCount?: number }
  ): Promise<{
    allowed: boolean;
    error?: string;
    usedCount: number;
    maxCvs: number;
    activeCount: number;
  }> {
    const activeCvs = await this.listCvs(userId);
    let cumulativeGenerated = user.generatedCvsCount ?? 0;
    if (isLocalDevModeAllowed()) {
      cumulativeGenerated = localDevDb.getGeneratedCvsCount(userId);
    }
    const usedCount = Math.max(cumulativeGenerated, activeCvs.length);

    const normalizedEmail = (user.email || "").trim().toLowerCase();
    const isAdmin = SUPERUSER_EMAILS.has(normalizedEmail) || user.role === "admin";
    if (isAdmin) {
      return {
        allowed: true,
        usedCount,
        maxCvs: 999999,
        activeCount: activeCvs.length,
      };
    }

    if (!user.planId || user.maxCvs === 0) {
      return {
        allowed: false,
        error:
          "Vitra is a paid service. Please activate a package (2 CVs for ₦6,000, up to 6 for ₦15,000, or up to 13 for ₦20,000) to create and save your CVs.",
        usedCount,
        maxCvs: 0,
        activeCount: activeCvs.length,
      };
    }

    if (usedCount >= user.maxCvs) {
      return {
        allowed: false,
        error: `You have reached your package limit of ${user.maxCvs} CV generations (${usedCount} of ${user.maxCvs} used) and exhausted your allowed access. Note: deleting an already saved CV does not restore generation credits. Please pay another premium to continue using our services and generate more CVs.`,
        usedCount,
        maxCvs: user.maxCvs,
        activeCount: activeCvs.length,
      };
    }

    return {
      allowed: true,
      usedCount,
      maxCvs: user.maxCvs,
      activeCount: activeCvs.length,
    };
  },

  async listCvs(userId: string): Promise<CvRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("cvs")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });
          if (!error && data && data.length > 0) {
            const records = data.map(mapDbRowToCvRecord);
            if (isLocalDevModeAllowed()) {
              for (const r of records) localDevDb.upsertCv?.(r);
            }
            return records;
          }
        }
      } catch (err) {
        console.warn("Supabase listCvs error, trying admin client:", err);
      }

      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data, error } = await admin
            .from("cvs")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });
          if (!error && data && data.length > 0) {
            const records = data.map(mapDbRowToCvRecord);
            if (isLocalDevModeAllowed()) {
              for (const r of records) localDevDb.upsertCv?.(r);
            }
            return records;
          }
        }
      } catch (err) {
        console.warn("Supabase admin listCvs error, falling back to local storage:", err);
      }
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.listCvsForUser(userId);
    }

    return [];
  },

  async getCv(cvId: string, userId: string): Promise<CvRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("cvs")
            .select("*")
            .eq("id", cvId)
            .eq("user_id", userId)
            .maybeSingle();
          if (!error && data) {
            const record = mapDbRowToCvRecord(data);
            if (isLocalDevModeAllowed()) {
              localDevDb.upsertCv?.(record);
            }
            return record;
          }
        }
      } catch (err) {
        console.warn("Supabase getCv error, trying admin client:", err);
      }

      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data, error } = await admin
            .from("cvs")
            .select("*")
            .eq("id", cvId)
            .eq("user_id", userId)
            .maybeSingle();
          if (!error && data) {
            const record = mapDbRowToCvRecord(data);
            if (isLocalDevModeAllowed()) {
              localDevDb.upsertCv?.(record);
            }
            return record;
          }
        }
      } catch (err) {
        console.warn("Supabase admin getCv error, falling back to local storage:", err);
      }
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.getCvForUser(cvId, userId);
    }

    return null;
  },

  async createCv(input: {
    userId: string;
    title: string;
    careerProfile: CareerProfile;
    templateId: TemplateId;
    structuredContent?: StructuredCvContent;
    settings?: CvEditorSettings;
    status?: CvStatus;
    parentCvId?: string | null;
  }): Promise<CvRecord> {
    const structuredContent = input.structuredContent || createEmptyStructuredCv();
    const settings = input.settings || createDefaultEditorSettings(input.careerProfile);
    const status = input.status || "draft";

    if (isSupabaseConfigured()) {
      const insertPayload = {
        user_id: input.userId,
        title: input.title,
        career_profile: input.careerProfile,
        template_id: input.templateId,
        structured_content: structuredContent,
        settings,
        status,
        parent_cv_id: input.parentCvId ?? null,
      };

      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("cvs")
            .insert(insertPayload)
            .select("*")
            .single();
          if (!error && data) {
            const rec = mapDbRowToCvRecord(data);
            if (isLocalDevModeAllowed()) localDevDb.upsertCv?.(rec);
            return rec;
          }
          console.warn("Supabase createCv warning, trying admin client:", error?.message);
        }
      } catch (err) {
        console.warn("Supabase createCv error, trying admin client:", err);
      }

      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data, error } = await admin
            .from("cvs")
            .insert(insertPayload)
            .select("*")
            .single();
          if (!error && data) {
            const rec = mapDbRowToCvRecord(data);
            if (isLocalDevModeAllowed()) localDevDb.upsertCv?.(rec);
            return rec;
          }
          console.warn("Supabase admin createCv error:", error?.message);
        }
      } catch (err) {
        console.warn("Supabase admin createCv error, falling back to local storage:", err);
      }
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.createCv({
        userId: input.userId,
        title: input.title,
        careerProfile: input.careerProfile,
        templateId: input.templateId,
        structuredContent,
        settings,
        status,
        parentCvId: input.parentCvId ?? null,
      });
    }

    throw new Error("Unable to save CV to database.");
  },

  async updateCv(
    cvId: string,
    userId: string,
    patch: Partial<{
      title: string;
      careerProfile: CareerProfile;
      templateId: TemplateId;
      structuredContent: StructuredCvContent;
      settings: CvEditorSettings;
      status: CvStatus;
    }>
  ): Promise<CvRecord | null> {
    if (isSupabaseConfigured()) {
      const updatePayload: Record<string, unknown> = {};
      if (patch.title !== undefined) updatePayload.title = patch.title;
      if (patch.careerProfile !== undefined) updatePayload.career_profile = patch.careerProfile;
      if (patch.templateId !== undefined) updatePayload.template_id = patch.templateId;
      if (patch.structuredContent !== undefined)
        updatePayload.structured_content = patch.structuredContent;
      if (patch.settings !== undefined) updatePayload.settings = patch.settings;
      if (patch.status !== undefined) updatePayload.status = patch.status;

      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("cvs")
            .update(updatePayload)
            .eq("id", cvId)
            .eq("user_id", userId)
            .select("*")
            .maybeSingle();
          if (!error && data) {
            const rec = mapDbRowToCvRecord(data);
            if (isLocalDevModeAllowed()) localDevDb.upsertCv?.(rec);
            return rec;
          }
        }
      } catch (err) {
        console.warn("Supabase updateCv error, trying admin client fallback:", err);
      }

      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data, error } = await admin
            .from("cvs")
            .update(updatePayload)
            .eq("id", cvId)
            .eq("user_id", userId)
            .select("*")
            .maybeSingle();
          if (!error && data) {
            const rec = mapDbRowToCvRecord(data);
            if (isLocalDevModeAllowed()) localDevDb.upsertCv?.(rec);
            return rec;
          }
          console.warn("Supabase admin updateCv error:", error?.message);
        }
      } catch (err) {
        console.warn("Supabase admin updateCv error, falling back to local storage:", err);
      }
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.updateCv(cvId, userId, patch);
    }

    return null;
  },

  async duplicateCv(cvId: string, userId: string): Promise<CvRecord | null> {
    const existing = await this.getCv(cvId, userId);
    if (!existing) return null;
    return this.createCv({
      userId,
      title: `${existing.title} (Copy)`,
      careerProfile: existing.careerProfile,
      templateId: existing.templateId,
      structuredContent: structuredClone(existing.structuredContent),
      settings: structuredClone(existing.settings),
      status: existing.status,
      parentCvId: existing.id,
    });
  },

  async deleteCv(cvId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const { error, count } = await supabase
            .from("cvs")
            .delete({ count: "exact" })
            .eq("id", cvId)
            .eq("user_id", userId);
          if (!error && (count || 0) > 0) {
            return true;
          }
        }
      } catch (err) {
        console.warn("Supabase deleteCv error, falling back to local storage:", err);
      }
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.deleteCv(cvId, userId);
    }

    return false;
  },

  async createVersionSnapshot(
    cvId: string,
    userId: string,
    label: string,
    templateId: TemplateId,
    structuredContent: StructuredCvContent
  ) {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return null;
      const { count } = await supabase
        .from("cv_versions")
        .select("id", { count: "exact", head: true })
        .eq("cv_id", cvId)
        .eq("user_id", userId);
      const { data, error } = await supabase
        .from("cv_versions")
        .insert({
          cv_id: cvId,
          user_id: userId,
          version_number: (count || 0) + 1,
          label,
          template_id: templateId,
          structured_content: structuredContent,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.createCvVersion(cvId, userId, label, templateId, structuredContent);
    }
    return null;
  },

  async saveUploadedOriginal(input: {
    userId: string;
    cvId: string | null;
    fileName: string;
    fileType: "pdf" | "docx";
    buffer: Buffer;
    extractedText: string;
    status: "extracted" | "reviewed" | "failed";
  }) {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) throw new Error("Storage unavailable.");
      const safeName = `${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
      const storagePath = `${input.userId}/${safeName}`;
      const mime =
        input.fileType === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const { error: uploadError } = await supabase.storage
        .from("cv-documents")
        .upload(storagePath, input.buffer, {
          contentType: mime,
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      const { data, error: dbError } = await supabase
        .from("cv_uploads")
        .insert({
          user_id: input.userId,
          cv_id: input.cvId,
          original_file_path: storagePath,
          original_file_name: input.fileName,
          file_type: input.fileType,
          file_size: input.buffer.length,
          extracted_text: input.extractedText,
          processing_status: input.status,
        })
        .select("*")
        .single();
      if (dbError) throw new Error(dbError.message);
      return data;
    }

    if (isLocalDevModeAllowed()) {
      const filePath = localDevDb.saveUploadedFile(input.userId, input.fileName, input.buffer);
      return localDevDb.createUploadRecord({
        userId: input.userId,
        cvId: input.cvId,
        originalFilePath: filePath,
        originalFileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.buffer.length,
        extractedText: input.extractedText,
        processingStatus: input.status,
      });
    }

    throw new Error("Storage is not configured.");
  },

  async listUploads(userId: string) {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("cv_uploads")
        .select("id, cv_id, original_file_name, file_type, file_size, processing_status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.listUploadsForUser(userId);
    }
    return [];
  },

  async deleteUpload(uploadId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return false;
      const { data: row } = await supabase
        .from("cv_uploads")
        .select("original_file_path")
        .eq("id", uploadId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!row) return false;
      await supabase.storage.from("cv-documents").remove([row.original_file_path]);
      const { error } = await supabase
        .from("cv_uploads")
        .delete()
        .eq("id", uploadId)
        .eq("user_id", userId);
      return !error;
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.deleteUploadRecord(uploadId, userId);
    }
    return false;
  },

  async saveAnalysis(cvId: string, userId: string, analysisResult: CvAnalysisResult) {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("cv_analyses")
        .insert({
          cv_id: cvId,
          user_id: userId,
          analysis_result: analysisResult,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.saveAnalysis(cvId, userId, analysisResult);
    }
    return null;
  },

  async getLatestAnalysis(cvId: string, userId: string): Promise<CvAnalysisResult | null> {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return null;
      const { data } = await supabase
        .from("cv_analyses")
        .select("analysis_result")
        .eq("cv_id", cvId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data?.analysis_result as CvAnalysisResult) || null;
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.getLatestAnalysisForCv(cvId, userId)?.analysisResult || null;
    }
    return null;
  },

  async saveJobDescription(input: {
    userId: string;
    cvId: string | null;
    jobTitle: string;
    company: string;
    description: string;
    extractedRequirements: Partial<JobTailoringResult>;
  }) {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) return null;
      const { data } = await supabase
        .from("job_descriptions")
        .insert({
          user_id: input.userId,
          cv_id: input.cvId,
          job_title: input.jobTitle,
          company: input.company,
          description: input.description,
          extracted_requirements: input.extractedRequirements,
        })
        .select("*")
        .single();
      return data;
    }

    if (isLocalDevModeAllowed()) {
      return localDevDb.saveJobDescription(input);
    }
    return null;
  },

  async deleteUserAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const admin = createSupabaseAdminClient();
      if (!admin) {
        return {
          ok: false,
          error:
            "Account deletion in cloud mode requires SUPABASE_SERVICE_ROLE_KEY on the server.",
        };
      }
      const { data: uploads } = await admin
        .from("cv_uploads")
        .select("original_file_path")
        .eq("user_id", userId);
      if (uploads && uploads.length > 0) {
        await admin.storage
          .from("cv-documents")
          .remove(uploads.map((u) => u.original_file_path));
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    if (isLocalDevModeAllowed()) {
      const ok = localDevDb.deleteUserAndAllData(userId);
      return { ok };
    }

    return { ok: false, error: "No database provider configured." };
  },
};

