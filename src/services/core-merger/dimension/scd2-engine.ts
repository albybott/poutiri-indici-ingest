/**
 * SCD2 Engine - Handles Slowly Changing Dimension Type 2 logic
 *
 * Implements hybrid strategy:
 * - Significant attributes (demographics) trigger new versions
 * - Non-significant attributes (contact info) updated in place
 */

import {
  type DimensionRecord,
  type SCD2Change,
  type SCD2Config,
  type DimensionType,
  ChangeType,
} from "../types/scd2";
import {
  detectAttributeChanges,
  calculateSignificanceScore,
  meetsVersionThreshold,
} from "../utils/scd2-utils";
import { generateAttributeHash } from "../utils/hash-utils";
import { logger } from "@/services/shared/utils/logger";

export class SCD2Engine {
  private config: SCD2Config;

  constructor(config: SCD2Config) {
    this.config = config;
  }

  /**
   * Detect changes between current and new dimension records
   */
  async detectChanges(
    currentRecord: DimensionRecord | null,
    newRecord: DimensionRecord
  ): Promise<SCD2Change> {
    // New record - no previous version exists
    if (!currentRecord) {
      return {
        changeType: ChangeType.NEW,
        businessKey: newRecord.businessKey,
        attributeChanges: [],
        newVersion: newRecord,
        significanceScore: 1.0, // New record is always significant
      };
    }

    // Compare attributes
    const attributeChanges = detectAttributeChanges(
      currentRecord,
      newRecord,
      this.config.comparisonRules
    );

    // No changes detected
    if (attributeChanges.length === 0) {
      return {
        changeType: ChangeType.NO_CHANGE,
        businessKey: newRecord.businessKey,
        attributeChanges: [],
        previousVersion: currentRecord,
        newVersion: currentRecord, // Keep current version
        significanceScore: 0,
      };
    }

    // Calculate significance score
    const significanceScore = calculateSignificanceScore(
      attributeChanges,
      this.config.comparisonRules
    );

    // Check if changes meet threshold for new version
    const requiresNewVersion = meetsVersionThreshold(
      attributeChanges,
      this.config.comparisonRules,
      this.config.changeThreshold
    );

    if (requiresNewVersion) {
      // Significant change - create new version
      logger.debug(
        `Significant change detected for ${this.config.dimensionType}`,
        {
          businessKey: newRecord.businessKey,
          significanceScore,
          changes: attributeChanges.length,
        }
      );

      return {
        changeType: ChangeType.UPDATED,
        businessKey: newRecord.businessKey,
        attributeChanges,
        previousVersion: currentRecord,
        newVersion: this.prepareNewVersion(currentRecord, newRecord),
        significanceScore,
      };
    } else {
      // Non-significant change - update in place
      logger.debug(
        `Non-significant change detected for ${this.config.dimensionType}`,
        {
          businessKey: newRecord.businessKey,
          significanceScore,
          changes: attributeChanges.length,
        }
      );

      return {
        changeType: ChangeType.NO_CHANGE,
        businessKey: newRecord.businessKey,
        attributeChanges,
        previousVersion: currentRecord,
        newVersion: this.updateInPlace(currentRecord, newRecord),
        significanceScore,
      };
    }
  }

  /**
   * Detect changes using hash-based comparison (faster for many attributes)
   */
  async detectChangesWithHash(
    currentRecord: DimensionRecord | null,
    newRecord: DimensionRecord
  ): Promise<SCD2Change> {
    // New record
    if (!currentRecord) {
      const attributeHash = this.generateHash(newRecord);
      return {
        changeType: ChangeType.NEW,
        businessKey: newRecord.businessKey,
        attributeChanges: [],
        newVersion: newRecord,
        attributeHash,
        significanceScore: 1.0,
      };
    }

    // Generate hashes for tracked fields only
    const currentHash = this.generateHash(currentRecord);
    const newHash = this.generateHash(newRecord);

    // No change in tracked attributes
    if (currentHash === newHash) {
      // Still check non-tracked fields for in-place updates
      const allChanges = detectAttributeChanges(
        currentRecord,
        newRecord,
        this.config.comparisonRules
      );

      const nonSignificantChanges = allChanges.filter((c) => !c.significant);

      if (nonSignificantChanges.length > 0) {
        return {
          changeType: ChangeType.NO_CHANGE,
          businessKey: newRecord.businessKey,
          attributeChanges: nonSignificantChanges,
          previousVersion: currentRecord,
          newVersion: this.updateInPlace(currentRecord, newRecord),
          attributeHash: currentHash,
          significanceScore: 0,
        };
      }

      return {
        changeType: ChangeType.NO_CHANGE,
        businessKey: newRecord.businessKey,
        attributeChanges: [],
        previousVersion: currentRecord,
        newVersion: currentRecord,
        attributeHash: currentHash,
        significanceScore: 0,
      };
    }

    // Significant change detected - create new version
    // Still detect individual attribute changes for audit trail
    const attributeChanges = detectAttributeChanges(
      currentRecord,
      newRecord,
      this.config.comparisonRules
    );

    const significanceScore = calculateSignificanceScore(
      attributeChanges,
      this.config.comparisonRules
    );

    logger.debug(
      `Hash-based change detected for ${this.config.dimensionType}`,
      {
        businessKey: newRecord.businessKey,
        oldHash: currentHash.substring(0, 8),
        newHash: newHash.substring(0, 8),
        changes: attributeChanges.length,
      }
    );

    return {
      changeType: ChangeType.UPDATED,
      businessKey: newRecord.businessKey,
      attributeChanges,
      previousVersion: currentRecord,
      newVersion: this.prepareNewVersion(currentRecord, newRecord),
      attributeHash: newHash,
      significanceScore,
    };
  }

  /**
   * Generate hash from tracked attributes only
   */
  private generateHash(record: DimensionRecord): string {
    return generateAttributeHash(record.attributes, this.config.trackedFields);
  }

  /**
   * Prepare new version of dimension (for significant changes)
   */
  private prepareNewVersion(
    currentRecord: DimensionRecord,
    newRecord: DimensionRecord
  ): DimensionRecord {
    return {
      ...newRecord,
      effectiveFrom: new Date(), // New version starts now
      effectiveTo: null,
      isCurrent: true, // This will be the new current version
      surrogateKey: undefined, // Will be assigned on insert
    };
  }

  /**
   * Update non-significant attributes in place
   */
  private updateInPlace(
    currentRecord: DimensionRecord,
    newRecord: DimensionRecord
  ): DimensionRecord {
    // Merge non-significant attribute changes into current record
    const updatedAttributes = {
      ...currentRecord.attributes,
    };

    // Update only non-significant fields
    for (const field of Object.keys(newRecord.attributes)) {
      const isSignificant = this.config.trackedFields.includes(field);
      if (!isSignificant) {
        updatedAttributes[field] = newRecord.attributes[field];
      }
    }

    return {
      ...currentRecord,
      attributes: updatedAttributes,
      lineage: newRecord.lineage, // Update lineage to latest
      // Keep same effectiveFrom, effectiveTo, isCurrent, surrogateKey
    };
  }

  /**
   * Create expired version record (set effectiveTo)
   */
  expireVersion(
    record: DimensionRecord,
    expireAt: Date = new Date()
  ): DimensionRecord {
    return {
      ...record,
      effectiveTo: expireAt,
      isCurrent: false,
    };
  }

  /**
   * Validate SCD2 constraints
   */
  async validateSCD2Constraints(
    records: DimensionRecord[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Group by business key
    const businessKeyGroups = new Map<string, DimensionRecord[]>();

    for (const record of records) {
      const keyString = JSON.stringify(record.businessKey);
      const group = businessKeyGroups.get(keyString) ?? [];
      group.push(record);
      businessKeyGroups.set(keyString, group);
    }

    // Check constraints for each business key
    for (const [keyString, group] of businessKeyGroups) {
      // Should only have one current version
      const currentVersions = group.filter((r) => r.isCurrent);
      if (currentVersions.length > 1) {
        errors.push(
          `Multiple current versions found for business key: ${keyString}`
        );
      }

      // Check date ranges don't overlap
      const sortedByEffectiveFrom = [...group].sort(
        (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime()
      );

      for (let i = 0; i < sortedByEffectiveFrom.length - 1; i++) {
        const current = sortedByEffectiveFrom[i];
        const next = sortedByEffectiveFrom[i + 1];

        if (current.effectiveTo && next.effectiveFrom < current.effectiveTo) {
          errors.push(`Overlapping date ranges for business key: ${keyString}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): SCD2Config {
    return this.config;
  }

  /**
   * Get dimension type
   */
  getDimensionType(): DimensionType {
    return this.config.dimensionType;
  }
}
