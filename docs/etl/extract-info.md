## File Names
column names for each Indici extract are below as they are not contained within the extract. 
All column names are taken from the files Indici provides us with, so they should marry with the column names you see in Indici’s data explorer. 
There are two additional columns PerOrgID and LoadedDateTime which we use within our database and have included for completeness.

## Allergies

[AllergyID]
[AppointmentID]
[AllergyTypeID]
[AllergyType]
[OnsetDate]
[DeactivationReason]
[MedicineID]
[Medicine]
[ReactionID]
[Reactions]
[ReactionTypeID]
[ReactionType]
[SeverityID]
[Severity]
[ReactionNotes]
[IsActive]
[IsDeleted]
[InsertedByID]
[InsertedBy]
[UpdatedByID]
[UpdatedBy]
[InsertedAt]
[UpdatedAt]
[PatientID]
[Patient]
[IsConfidential]
[PracticeID]
[Practice]
[MGENCODE]
[MCLACODE]
[MedTechID]
[MedicineClassificationID]
[AllergyCategoryID]
[AllergyCategory]
[Comment]
[SubstanceTypeID]
[SubstanceType]
[FavouriteSubstanceID]
[FavouriteSubstance]
[DiseaseID]
[Disease]
[OtherSubstance]
[MedicineTypeID]
[MedicineType]
[UserLoggingID]
[LoggingUserName]
[ShowOnPortal]
[WarningType]
[ROWINACTIVE]
[IsReviewed]
[ProviderID]
[Provider]
[PracticeLocationID]
[LocationName]
[PerOrgID]
[LoadedDateTime]

## AppointmentMedicaitons

[MedicationID]
,[AppointmentID]
,[PatientID]
,[SCTID]
,[MedicineID]
,[MedicineName]
,[Strength]
,[Form]
,[Take]
,[Frequency]
,[DAILYFREQ]
,[Route]
,[Duration]
,[DurationType]
,[StartDate]
,[EndDate]
,[StopDate]
,[Repeats]
,[SAStatus]
,[SANumber]
,[ExpiryDate]
,[SubsidyAmount]
,[Price]
,[ProviderID]
,[Provider]
,[TaskID]
,[Directions]
,[IsConfidential]
,[IsLongTerm]
,[IsPrescribedExternally]
,[IsStopped]
,[IsHighlighted]
,[IsPracticeinAdmin]
,[IsTrial]
,[StoppedReason]
,[MedicationStopReason]
,[RxSCID]
,[RxDate]
,[RxStatus]
,[IsDispense]
,[PrintedBy]
,[PrintedAt]
,[Comments]
,[IsActive]
,[IsDeleted]
,[InsertedBy]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[MedTechID]
,[IsMapped]
,[MedTechDrugCode]
,[MedTechGenericName]
,[PracticeID]
,[PrescibedExternlayID]
,[PrescibedExternlayDesc]
,[Quantity]
,[IsGenericSubstitution]
,[IsFrequentDispensed]
,[InitialDispensePeriod]
,[InitialDispensePeriodType]
,[TrialPeriod]
,[TrialType]
,[IsSpecalistRecomended]
,[SpecalistName]
,[RecomendationDate]
,[IsEndorsementCriteria]
,[IsProviderEligibleCoPayment]
,[UserLoggingID]
,[IsOverride]
,[OverrideReason]
,[IsTaskGenerated]
,[ShowOnPortal]
,[PatientSARecordID]
,[StoppedBy]
,[MappedBy]
,[MappedDate]
,[RecomendationOverrideReason]
,[IsVariableDose]
,[IsDoseChange]
,[ReferenceMedication]
,[MIMSCODE]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeLocationID]
,[LocationName]
,[PrescriptionPrintDate]
,[PrescriptionNo]
,[SubstanceName]
,[PerOrgId]
,[LoadedDateTime]

## Appointments

[AppointmentID]
,[PatientID]
,[AppointmentType]
,[AppointmentStatus]
,[ScheduleDate]
,[Notes]
,[Arrived]
,[WaitingForpayment]
,[AppointmentCompleted]
,[ConsultTime]
,[Booked]
,[MedTechID]
,[InsertedAt]
,[InsertedBy]
,[UpdatedAt]
,[UpdatedBy]
,[Practice]
,[PracticeID]
,[ProviderID]
,[IsActive]
,[IsDeleted]
,[Provider]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeLocationID]
,[LocationName]
,[ReasonforVisit]
,[StatusGroup]
,[Duration]
,[AppointmentOutComeID]
,[AppointmentOutCome]
,[AppointmentTypeID]
,[BookingSourceID]
,[BookingSource]
,[ConsultEndTime]
,[ConsultStartTime]
,[ConsultTimerStatusID]
,[Description]
,[EndTime]
,[GeneratedTime]
,[GPQueueTime]
,[IsArrived]
,[IsConsultParked]
,[IsDummy]
,[LastAppointmentStatusDate]
,[LastAppointmentStatusID]
,[CancelReason]
,[ParkedReason]
,[PriorityID]
,[ArrivedTime]
,[CancelledTime]
,[NotArrivedTime]
,[NurseQueueTime]
,[OnHoldTime]
,[ReadOnlyTime]
,[SelfAssessmentCompletedTime]
,[SelfAssessmentQueueTime]
,[StartTime]
,[TriageQueueTime]
,[VirtualQueueTime]
,[IsConfidential]
,[IsConsenttoShare]
,[PerOrgID]
,[LoadedDateTime]

## Diagnosis

[DiagnosisID]
,[AppointmentID]
,[PatientID]
,[DiseaseID]
,[Disease]
,[DiagnosisDate]
,[DiagnosisByID]
,[DiagnosisBy]
,[Summary]
,[IsLongTerm]
,[AddtoProblem]
,[IsHighlighted]
,[SequenceNo]
,[IsActive]
,[IsDeleted]
,[InsertedByID]
,[InsertedBy]
,[UpdatedByID]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[IsConfidential]
,[DiagnosisTypeID]
,[DiagnosisType]
,[ClassificationRecord]
,[MedTechID]
,[MedTechReadCode]
,[MedTechReadTerm]
,[IsMapped]
,[PracticeID]
,[Practice]
,[OnSetDate]
,[UserLoggingID]
,[LoggingUserName]
,[RecallID]
,[Recall]
,[ExclusionStartDate]
,[ExclusionEndDate]
,[ShowOnPortal]
,[ExtAppointmentID]
,[PatientMEDTechID]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeLocationID]
,[LocationName]
,[SNOMEDID]
,[SnomedTerm]
,[CONCEPTID]
,[PerOrgId]
,[LoadedDateTime]

## Immunisation

[AppointmentImmunisationID]
,[PatientID]
,[AppointmentID]
,[PatientScheduleID]
,[VaccineID]
,[VaccineName]
,[VaccineCode]
,[Dose]
,[DoseNumber]
,[AdministrationSiteID]
,[AdministrationSite]
,[RouteID]
,[Route]
,[BatchNumber]
,[ExpiryDate]
,[ImmunisationStatusID]
,[ImmunisationStatus]
,[VaccineOutComeID]
,[VaccineOutCome]
,[IsNIRAck]
,[Reason]
,[ProviderID]
,[Provider]
,[Comments]
,[AdministrationTime]
,[VaccineIndicationID]
,[VaccineIndication]
,[VaccineIndicationCode]
,[NeedleLength]
,[HasDiluent]
,[DiluentBatchNo]
,[DiluentExpiryDate]
,[IsConfidential]
,[CostingCodeID]
,[CostingCode]
,[BrandID]
,[Brand]
,[IsActive]
,[IsDeleted]
,[InsertedByID]
,[InsertedBy]
,[UpdatedByID]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[IsParked]
,[MedTechID]
,[PracticeID]
,[Practice]
,[IsAutoBill]
,[VaccinatorID]
,[Vaccinator]
,[UserLoggingID]
,[LoggingUserName]
,[NIRSentDate]
,[ShowOnPortal]
,[VaccinatorCode]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeLocationID]
,[LocationName]
,[VaccineGroupID]
,[VaccineGroup]
,[PerOrgId]
,[LoadedDateTime]

## Inbox

[InboxFolderItemID]
,[FolderID]
,[FolderName]
,[IsSystemFolder]
,[OrderNo]
,[ItemTypeID]
,[ItemType]
,[PatientID]
,[ProviderID]
,[PracticeID]
,[PatientName]
,[Provider]
,[PracticeName]
,[FromOrgID]
,[FromOrganizationName]
,[AssignToID]
,[AssignTo]
,[ResultDate]
,[MessageSubjectID]
,[MessageSubject]
,[Comments]
,[MarkAsRead]
,[IsConfidential]
,[ShowonPortal]
,[IsReviewed]
,[ShowOnTimeLine]
,[IsActive]
,[IsDeleted]
,[InsertedByID]
,[InsertedBy]
,[UpdatedByID]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[MedTechID]
,[DMSID]
,[IsRepeatRX]
,[IsRepliedRx]
,[ExternalRef]
,[ABNORMResult]
,[IsDeactivated]
,[FolderGroup]
,[DocumentCode]
,[IsGP2GP]
,[InformatID]
,[Informat]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[FiledAt]
,[PerOrgId]
,[LoadedDateTime]

## InboxDetail

[InBoxFolderItemInLineID]
,[InboxFolderItemID]
,[PatientID]
,[PracticeID]
,[PracticeName]
,[Prompt]
,[Result]
,[AbNorm]
,[Unit]
,[ResultCode]
,[ReferenceRanges]
,[LineNumber]
,[InsertedAt]
,[IsConfidential]
,[ShowonPortal]
,[IsActive]
,[IsDeleted]
,[PerOrgId]
,[LoadedDateTime]

## InvoiceDetail

[InvoiceDetailID]
,[InvoiceTransactionID]
,[MasterServiceSubServiceID]
,[AppointmentServiceID]
,[Comments]
,[Quantity]
,[ClaimAmount]
,[CoPayment]
,[GrossClaimAmount]
,[GrossCoPayment]
,[IsBillingAmount]
,[FunderID]
,[FunderName]
,[ContractServiceID]
,[ContractServiceName]
,[IsFunded]
,[SubmissionStatus]
,[CaseNo]
,[SequenceNo]
,[BillingClaimStatusID]
,[MasterServiceName]
,[MasterServiceCode]
,[MasterServiceDescription]
,[ServiceName]
,[Description]
,[Code]
,[FeeCode]
,[ServiceCode]
,[SubServiceDescription]
,[Duration]
,[IsCommonService]
,[ServiceCodeForClaim]
,[IsActive]
,[IsDeleted]
,[InsertedByID]
,[UpdatedByID]
,[InsertedBy]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[UserLoggingID]
,[LoggingUserName]
,[BillingRefID]
,[BillingReferralID]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeID]
,[PerOrgID]
,[LoadedDateTime]

## Invoices

[InvoiceTransactionID]
,[PatientID]
,[ACDATE]
,[MedtechID]
,[PaymentMode]
,[TotalAmount]
,[UnpaidAmount]
,[ClaimNotes]
,[Description]
,[IncomeProvider]
,[InvoicePaymentNo]
,[Provider]
,[DomicileCode]
,[InsertedAt]
,[InsertedBy]
,[UpdatedAt]
,[UpdatedBy]
,[IsActive]
,[TransactionType]
,[ProviderID]
,[PracticeID]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeLocationID]
,[LocationName]
,[Notes]
,[PerOrgId]
,[LoadedDateTime]

## Measurements

[PatientID]
,[ScreaningID]
,[AppointmentID]
,[ScreeningDate]
,[SCNCODE]
,[ScreeningType]
,[ScreeningGroup]
,[Outcome]
,[OutcomeDescription]
,[Notes]
,[IsActive]
,[UpdatedByID]
,[UpdatedBy]
,[UpdatedAt]
,[InsertedByID]
,[InsertedBy]
,[InsertedAt]
,[PatientMedTechID]
,[Practice]
,[PracticeID]
,[ProviderID]
,[ProviderCode]
,[ProviderName]
,[HBAIC]
,[IsDeleted]
,[CarePlanID]
,[CarePlaneName]
,[IsConfidential]
,[IsGP2GP]
,[IsPatientPortal]
,[IsShowonTimeLine]
,[MedTechID]
,[ScreeningSourceTypeID]
,[ServiceTemplateID]
,[ServiceTemplateName]
,[UserLoggingID]
,[LoggingUserName]
,[Field1]
,[Field2]
,[Field3]
,[Field4]
,[Field5]
,[Field6]
,[Field7]
,[Field8]
,[Field9]
,[Field10]
,[Field11]
,[Field12]
,[Field13]
,[Field14]
,[Field15]
,[Field16]
,[Field17]
,[Field18]
,[Field19]
,[Field20]
,[Field21]
,[Field22]
,[Field23]
,[Field24]
,[Field25]
,[Field26]
,[Field27]
,[Field28]
,[Field29]
,[Field30]
,[Field31]
,[Field32]
,[Field33]
,[Field34]
,[Field35]
,[Field36]
,[Field37]
,[Field38]
,[Field39]
,[Field40]
,[Field41]
,[Field42]
,[Field43]
,[Field44]
,[Field45]
,[Field46]
,[Field47]
,[Field48]
,[Field49]
,[Field50]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeLocationID]
,[LocationName]
,[Field51]
,[Field52]
,[Field53]
,[Field54]
,[Field55]
,[Field56]
,[Field57]
,[Field58]
,[Field59]
,[Field60]
,[Field61]
,[Field62]
,[Field63]
,[Field64]
,[Field65]
,[Field66]
,[Field67]
,[Field68]
,[Field69]
,[Field70]
,[Field71]
,[Field72]
,[Field73]
,[Field74]
,[Field75]
,[Field76]
,[Field77]
,[Field78]
,[Field79]
,[Field80]
,[Field81]
,[Field82]
,[Field83]
,[Field84]
,[Field85]
,[Field86]
,[Field87]
,[Field88]
,[Field89]
,[Field90]
,[Field91]
,[Field92]
,[Field93]
,[Field94]
,[Field95]
,[Field96]
,[Field97]
,[Field98]
,[Field99]
,[Field100]
,[Score]
,[ScreeningTypeID]
,[PerOrgId]
,[LoadedDateTime]

## Medicine

[MedicineID]
,[MedicineName]
,[MedicineShortName]
,[SCTID]
,[Type]
,[PharmaCode]
,[IsActive]
,[IsDeleted]
,[PerOrgId]
,[PracticeID]
,[LoadedDateTime]

## NextofKin

[NexttoKinID]
,[PatientID]
,[NOKProfileID]
,[NHINumber]
,[Name]
,[FullAddress]
,[CellNumber]
,[DayPhone]
,[NightPhone]
,[IsEmergency]
,[RelationshipTypeID]
,[RelationshipType]
,[IsActive]
,[IsDeleted]
,[InsertedByID]
,[InsertedBy]
,[UpdatedByID]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[UserLoggingID]
,[LoggingUserName]
,[IsGP2GP]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PracticeID]
,[PerOrgId]
,[LoadedDateTime]

## Patient

[PatientID]
,[NHINumber]
,[IsNHIValidate]
,[Title]
,[FirstName]
,[MiddleName]
,[FamilyName]
,[FullName]
,[PreferredName]
,[OtherMaidenName]
,[MaritalStatusID]
,[MaritalStatus]
,[GenderID]
,[Gender]
,[DOB]
,[Age]
,[AgeType]
,[AgeGroup]
,[IsAlive]
,[DeathDate]
,[DOBSource]
,[PicturePath]
,[ConsentedtoShare]
,[PlaceofBirth]
,[CountryofBirthID]
,[CountryOfBirth]
,[CellNumber]
,[DayPhone]
,[NightPhone]
,[Email]
,[SecondaryEmail]
,[PreferredContactMethod]
,[ConsentTextMessaging]
,[IsPortalUser]
,[IsActive]
,[IsDeleted]
,[InsertedBy]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[Notes]
,[IsGenderSelfIdentified]
,[SexRelatedGender]
,[IsWorkedVisaRequired]
,[Balance]
,[MedTechBalance]
,[MedTechDATELASTPAY]
,[MedTechDATELASTSTMT]
,[RegisterStatusID]
,[RegisterStatus]
,[MedTechNOK]
,[PracticeName]
,[CalculatedBalance]
,[LastStatementDate]
,[LastInvoiceDate]
,[LastPaymentDate]
,[ProviderName]
,[ChartNumber]
,[Extention]
,[PracticeRemarks]
,[IsInsured]
,[InsuredRemarks]
,[SmokingType]
,[AccountHolder]
,[AccountHolderEmployer]
,[IsCommunityServiceCard]
,[CommunityServiceCardNo]
,[CommunityServiceCardExipryDate]
,[CommunityServiceCardSighted]
,[IsHealthCard]
,[HealthCardNo]
,[HealthCardExpiryDate]
,[HealthCardSighted]
,[WINZ]
,[IsTransferOfRecords]
,[TransferofRecordsRemarks]
,[EnrolmentType]
,[EnrolmentStatusID]
,[EnrolmentStatus]
,[EnrolmentDate]
,[EnrolmentMethod]
,[EnrolmentVerifier]
,[FundingStatusID]
,[FundingStatus]
,[RejectionReason]
,[FundingFrom]
,[FundingTo]
,[AccountGroup]
,[GMSCode]
,[ResidentialStatus]
,[IsNKA]
,[IsHighCare]
,[HighCareReason]
,[IsCarePlan]
,[IsNewRegisteration]
,[IsOptOff]
,[IsBPGraph]
,[IsBMIGraph]
,[IsINRGraph]
,[IsHbA1cGraph]
,[ASRMarkStatus]
,[IsHeightGraph]
,[IsWeightGraph]
,[IsHcGraph]
,[NESStatus]
,[NESComments]
,[MedTechBalanceDate]
,[IsHeartRate]
,[IsPremature]
,[PrematureWeek]
,[PatientPHOID]
,[ConsultUpdatedAt]
,[Occupation]
,[EmergencyContact]
,[EmergencyContactName]
,[SecondaryContact]
,[SecondaryContactName]
,[ProviderID]
,[PracticeID]
,[PortalRegistrationStatus]
,[RegistrationDate]
,[MedTechID]
,[PermanentAddressHouseNumber]
,[PermanentAddressBuildingNumber]
,[PermanentAddressStreetNumber]
,[PermanentAddressSuburbTownID]
,[PermanentAddressSuburb]
,[PermanentAddressCityAreaID]
,[PermanentAddressCity]
,[PermanentAddressPostalCode]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[PermanentAddressCountryID]
,[PermanentAddressCountry]
,[PermanentAddress]
,[PermanentAddressDHBCode]
,[PermanentAddressDomicileCode]
,[PermanentAddressDeprivationQuintile]
,[PermanentAddressDeprivationDecile]
,[PermanentAddressMeshblock]
,[PermanentAddressMatchScore]
,[PermanentAddressUncertaintyCode]
,[TemporaryAddress]
,[PostalAddressHouseNumber]
,[PostalAddressBuildingNumber]
,[PostalAddressStreetNumber]
,[PostalAddressSuburbTownID]
,[PostalAddressSuburb]
,[PostalAddressCityAreaID]
,[PostalAddressCity]
,[PostalAddressPostalCode]
,[PostalAddressLatitude]
,[PostalAddressLongitude]
,[PostalAddressCountryID]
,[PostalAddressCountry]
,[PostalAddress]
,[PostalAddressDHBCode]
,[PostalAddressDomicileCode]
,[PostalAddressDeprivationQuintile]
,[PostalAddressDeprivationDecile]
,[PostalAddressMeshblock]
,[PostalAddressMatchScore]
,[PostalAddressUncertaintyCode]
,[EthnicityID]
,[Ethnicity]
,[ETHCODE]
,[ETHCODE2]
,[SecondaryEthnicityID]
,[SecondaryEthnicity]
,[ETHCODE3]
,[OtherEthnicityID]
,[OtherEthnicity]
,[EnrolmentID]
,[PHOName]
,[EnrolmentExpiryDate]
,[IsConsentToShare]
,[IsWorkVisa]
,[WorkVisaStartDate]
,[WorkVisaExpiryDate]
,[EnrolmentQuarter]
,[PracticeLocation]
,[AccountHolderTypeID]
,[PatientType]
,[BreastScreenID]
,[BreastScreen]
,[IsPregnant]
,[ApplyCharges]
,[IncludeInPrint]
,[IsCareplus]
,[CarePlusStartDate]
,[CarePlusEnddate]
,[CarePlusLincStatusID]
,[CarePlusLincStatus]
,[NHIStatusID]
,[NHIStatus]
,[PerOrgId]
,[LoadedDateTime]
,[AccountHolderProfileID]
,[ComunityServiceEffectiveDate]
,[DefaultGPMCNo]
,[DefaultGPName]
,[DefaultPracticeEDI]
,[DefaultPracticeName]
,[EnrolmentEndDate]
,[IsCapitated]
,[IsConsentAutoReminderTextMessaging]
,[IsConsentForExperienceSurvey]
,[IsConsentToImportClinicalRecords]
,[IsConsentToPrivateEmailAddress]
,[IsConsentToShareClinicalRecords]
,[IsConsentToShareHealth1]
,[IsConsentToShareMyRecordOnSEHR]
,[IsConsentToSharePHODataCollection]
,[IsIncludeAccountFee]
,[IsIncludeStatementFee]
,[IsLinkedCSCExists]
,[IsTestRecord]
,[PharmacyID]
,[ResidentialStatusID]
,[VisaExpiry]

## PatientAlerts

[PatientAlertID]
,[PatientID]
,[TypeID]
,[Type]
,[AlertID]
,[Alert]
,[SeverityID]
,[Severity]
,[AlertValue]
,[LastUpdatedDate]
,[EffectiveDate]
,[ExpiryDate]
,[Note]
,[IsActive]
,[IsDeleted]
,[IsDeleted]
,[InsertedByID]
,[InsertedBy]
,[UpdatedByID]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[MedTechID]
,[UserLoggingID]
,[LoggingUserName]
,[IsGP2GP]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[AlertState]
,[PracticeID]
,[ProviderID]
,[PerOrgId]
,[LoadedDateTime]

## PracticeInfo

[PracticeID]
,[PracticeName]
,[PracticeCategory]
,[PracticeSpeciality]
,[PHO]
,[OrganizationType]
,[OrgShortName]
,[OrgCode]
,[EDIAccount]
,[LegalEntityTitle]
,[LegalStatus]
,[IncorporationNumber]
,[LegalDate]
,[Comments]
,[Formula]
,[OwnershipModel]
,[Rural]
,[PrimaryPhone]
,[SecondaryPhone]
,[OtherPhone]
,[PrimaryEmail]
,[SecondaryEmail]
,[OtherEmail]
,[Pager]
,[Fax1]
,[Fax2]
,[HealthFacilityNo]
,[HPIFacilityNo]
,[HPIFacilityExt]
,[HPIOrganizationID]
,[HPIOrganizationExt]
,[GSTNo]
,[ACCNo]
,[BankAccountNo]
,[MOHSendingPracticeID]
,[AfterHoursNumber]
,[EmergencyNumber]
,[IsActive]
,[IsDeleted]
,[PerOrgID]
,[LoadedDateTime]

## Provider

[ProviderID]
,[PracticeID]
,[NHINumber]
,[IsNHIValidate]
,[Title]
,[FirstName]
,[MiddleName]
,[FamilyName]
,[FullName]
,[PreferredName]
,[OtherMaidenName]
,[MaritalStatus]
,[Gender]
,[DOB]
,[Age]
,[AgeType]
,[AgeGroup]
,[IsAlive]
,[DeathDate]
,[DOBSource]
,[PicturePath]
,[ConsentedtoShare]
,[PlaceofBirth]
,[CountryOfBirth]
,[CellNumber]
,[DayPhone]
,[NightPhone]
,[Email]
,[SecondaryEmail]
,[PreferredContactMethod]
,[ConsentTextMessaging]
,[IsPortalUser]
,[IsActive]
,[IsDeleted]
,[InsertedBy]
,[UpdatedBy]
,[InsertedAt]
,[UpdatedAt]
,[IsSameAddress]
,[Notes]
,[IsGenderSelfIdentified]
,[SexRelatedGender]
,[IsWorkedVisaRequired]
,[Balance]
,[RegisterStatus]
,[MedTechNOK]
,[PracticeName]
,[CalculatedBalance]
,[PermanentAddress]
,[DeprivationQuintile]
,[UncertaintyCode]
,[PostalAddress]
,[TemporaryAddress]
,[City]
,[Suburb]
,[PortalRegistrationStatus]
,[Ethnicity]
,[AffiliationID]
,[Affiliation]
,[AffiliationCode]
,[NZMCNO]
,[NPINo]
,[HBLMatPayeeNo]
,[HBLMatAgreeNo]
,[HPacMatAgreeNo]
,[HPacMatAgreeVer]
,[HBLPayeeNo]
,[HBLGPAgreeNo]
,[HBLGPAgreeVer]
,[AccreditationNo]
,[PHOContractNo]
,[PHOContractVer]
,[GroupID]
,[GroupName]
,[ACCProviderCode]
,[HealthFacilityNo]
,[HPINo]
,[UnloadRef]
,[ACCProviderNo]
,[ACCVendorID]
,[PinPanNo]
,[MemberNo]
,[RHAPayeeNo]
,[BudgetNo]
,[IPA]
,[RegisterationNo]
,[RegisterationNo]
,[LabNo]
,[LabTestsDrID]
,[ColorCode]
,[IsDoctor]
,[ACC45Prefix]
,[NextACC45No]
,[MaximumACC45No]
,[AITCPrefix]
,[NextAITCNo]
,[MaximumAITCNo]
,[ARC18NextACCFormNo]
,[M45Prefix]
,[NextM45No]
,[MaximumM45No]
,[IsNZFAvoid]
,[IsNZFAdjust]
,[IsNZFInformation]
,[IsNZFNoAction]
,[IsNZFMonitor]
,[ProviderCode]
,[GenericProfileTypeID]
,[CurrentAppointmentID]
,[SureMedUserName]
,[IsInvoicingDiary]
,[IsGP2GP]
,[FromDatePractice]
,[APCExpiryDate]
,[MPSExpiryDate]
,[APCName]
,[PracticeLocation]
,[UserRole]
,[ProviderPermanentAddressLatitude]
,[ProviderPermanentAddressLongitude]
,[PerOrgId]
,[LoadedDateTime]

## Recalls

[ReCallID]
,[PatientID]
,[ReCallDate]
,[IsContacted]
,[Notes]
,[PatientMedTechID]
,[RecallReason]
,[ScreeningType]
,[Code]
,[Vaccine]
,[VaccineGroup]
,[ReCallGroup]
,[InsertedAt]
,[Insertedby]
,[UpdatedAt]
,[UpdatedBy]
,[IsActive]
,[Practice]
,[PracticeID]
,[ProviderID]
,[IsDeleted]
,[PermanentAddressLatitude]
,[PermanentAddressLongitude]
,[IsConfidential]
,[ShowonPatientPortal]
,[IsCanceled]
,[ReCallAttempts]
,[SCNCode]
,[PerOrgId]
,[LoadedDateTime]

## Vaccine

[VaccineID]
,[VaccineCode]
,[VaccineName]
,[LongDescription]
,[IsActive]
,[IsDeleted]
,[CodingSystem]
,[GenderID]
,[Gender]
,[IsNIR]
,[PerOrgId]
,[PracticeID]
,[LoadedDateTime]

## Handlers

The Raw Loader uses schema-driven handlers to process each Indici extract type. These handlers are automatically generated from Drizzle ORM schema definitions and provide type-safe, validated data loading for each extract type.

### Handler Architecture

Each handler extends `BaseSchemaDrivenHandler` and implements the `ExtractHandler` interface:

```typescript
interface ExtractHandler {
  extractType: string;        // The Indici extract type (e.g., "Patient")
  tableName: string;          // Target raw table (e.g., "raw.patients")
  columnMapping: string[];    // Ordered list of column names
  validationRules: ValidationRule[]; // Data validation rules

  // Optional lifecycle methods
  preProcess?(row: CSVRow): CSVRow;
  postProcess?(row: RawTableRow): RawTableRow;
  transformRow?(row: CSVRow): RawTableRow;
}
```

### Handler Generation

Handlers are automatically generated from database schema definitions using the `SchemaDrivenHandlerGenerator`. The generation process:

1. **Schema Analysis**: Reads Drizzle table schemas from `src/db/schema/raw/`
2. **Column Mapping**: Extracts column names and types from schema definitions
3. **Validation Rules**: Applies basic validation (required fields, format checks)
4. **Handler Creation**: Generates TypeScript classes extending `BaseSchemaDrivenHandler`

### Available Handlers

| Extract Type | Handler Class | Target Table | Columns | Key Features |
|--------------|---------------|--------------|---------|--------------|
| **Allergies** | `AllergiesSchemaHandler` | `raw.allergies` | 60+ | Allergy reactions, classifications, medications |
| **AppointmentMedications** | `AppointmentMedicationsSchemaHandler` | `raw.appointment_medications` | 160+ | Medication details, dosages, prescriptions |
| **Appointments** | `AppointmentsSchemaHandler` | `raw.appointments` | 225+ | Consultations, scheduling, outcomes |
| **Diagnoses** | `DiagnosesSchemaHandler` | `raw.diagnoses` | 280+ | Medical diagnoses, classifications, SNOMED |
| **Immunisation** | `ImmunisationSchemaHandler` | `raw.immunisation` | 340+ | Vaccines, administration, NIR reporting |
| **Inbox** | `InboxSchemaHandler` | `raw.inbox` | 400+ | Messages, documents, test results |
| **InboxDetail** | `InboxDetailSchemaHandler` | `raw.inbox_detail` | 25+ | Detailed test results and values |
| **InvoiceDetail** | `InvoiceDetailSchemaHandler` | `raw.invoice_detail` | 470+ | Billing details, services, claims |
| **Invoices** | `InvoicesSchemaHandler` | `raw.invoices` | 510+ | Invoice headers, payments, providers |
| **Measurements** | `MeasurementsSchemaHandler` | `raw.measurements` | 650+ | Clinical measurements, screenings |
| **Medicine** | `MedicineSchemaHandler` | `raw.medicine` | 10+ | Medicine catalog, classifications |
| **NextOfKin** | `NextOfKinSchemaHandler` | `raw.next_of_kin` | 25+ | Emergency contacts, relationships |
| **Patient** | `PatientsSchemaHandler` | `raw.patients` | 263+ | Demographics, enrollment, addresses |
| **PatientAlerts** | `PatientAlertsSchemaHandler` | `raw.patient_alerts` | 60+ | Clinical alerts, warnings |
| **PracticeInfo** | `PracticeInfoSchemaHandler` | `raw.practice_info` | 15+ | Practice details, PHO information |
| **Provider** | `ProvidersSchemaHandler` | `raw.providers` | 1125+ | Healthcare provider details |
| **Recalls** | `RecallsSchemaHandler` | `raw.recalls` | 65+ | Patient recall management |
| **Vaccine** | `VaccineSchemaHandler` | `raw.vaccine` | 10+ | Vaccine catalog, codes |

### Handler Lifecycle

1. **Pre-Processing**: Optional row-level preprocessing before validation
2. **Validation**: Applies configured validation rules to each row
3. **Transformation**: Converts CSV rows to database format
4. **Post-Processing**: Optional final modifications before database insertion
5. **Lineage Addition**: Automatically adds audit columns (s3_bucket, s3_key, etc.)

### Validation Rules

Each handler includes built-in validation rules for data quality:

```typescript
validationRules: ValidationRule[] = [
  {
    columnName: "patient_id",
    ruleType: "required",
    validator: (value) => /^\d+$/.test(value),
    errorMessage: "patient_id must be numeric",
  },
  {
    columnName: "nhi_number",
    ruleType: "format",
    validator: (value) => value === "" || /^[A-Z]{3}\d{4}$/.test(value),
    errorMessage: "nhi_number must be in format XXX1234 or empty",
  },
  {
    columnName: "email",
    ruleType: "format",
    validator: (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    errorMessage: "email must be valid format or empty",
  },
];
```

### Custom Handler Development

For special processing requirements, handlers can be customized:

```typescript
export class CustomPatientsHandler extends PatientsSchemaHandler {
  async transformRow(row: CSVRow): Promise<RawTableRow> {
    // Custom transformation logic
    const transformed = await super.transformRow(row);

    // Add custom processing
    transformed.calculated_age = calculateAge(transformed.dob);

    return transformed;
  }

  async preProcess(row: CSVRow): CSVRow {
    // Pre-validation cleanup
    row.email = row.email?.toLowerCase().trim();
    return row;
  }
}
```

### Handler Factory

The `ExtractHandlerFactory` manages handler registration and instantiation:

```typescript
// Get handler for extract type
const handler = await handlerFactory.getHandler("Patient");

// Register custom handler
await handlerFactory.registerHandler(new CustomPatientsHandler());
```

### Performance Considerations

- **Batch Processing**: Handlers support configurable batch sizes for optimal throughput
- **Memory Management**: Large datasets are processed in streaming batches
- **Concurrent Processing**: Multiple handlers can process different extract types simultaneously
- **Error Isolation**: Validation errors in one row don't affect others in the same batch

### Monitoring and Debugging

Handlers integrate with the comprehensive monitoring system:

- **Progress Tracking**: Real-time processing progress per extract type
- **Error Reporting**: Detailed validation error reporting with row-level context
- **Performance Metrics**: Throughput and latency tracking per handler
- **Audit Trail**: Complete lineage tracking for troubleshooting

### Integration with ETL Pipeline

Handlers are the bridge between raw CSV data and structured database storage:

```
CSV File → Handler Validation → Schema Mapping → Raw Table → Staging Transform → Core Merge
     ↓           ↓                    ↓            ↓            ↓
   Parsing    Data Quality        Type Safety   Audit Trail  Business Logic
```

This architecture ensures data integrity, type safety, and comprehensive audit trails throughout the ETL pipeline.

## Handler Connections Across the Pipeline

The ETL pipeline uses a consistent handler pattern across all stages, with each phase having specialized handlers that connect seamlessly to transform data from raw files to business-ready tables.

### Handler Flow Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Raw Loader    │ -> │  Staging Tables  │ -> │   Core Merger   │ -> │   Core Tables   │
│   Handlers      │    │                  │    │   Handlers      │    │                 │
│                 │    │ (via Staging     │    │                 │    │ (SCD2, Facts,   │
│ • Parse CSV     │    │  Transformer)    │    │ • Business      │    │  Dimensions)    │
│ • Validate      │    │                  │    │   Logic         │    │                 │
│ • Load Raw      │    │                  │    │ • SCD2 History  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

### Handler Types by Pipeline Stage

| Pipeline Stage | Handler Type | Purpose | Input | Output |
|----------------|-------------|---------|-------|--------|
| **Raw Loading** | `ExtractHandler` | Parse & load CSV | S3 CSV files | `raw.*` tables |
| **Staging** | `StagingExtractHandler` | Transform & validate | `raw.*` tables | `stg.*` tables |
| **Core Merge** | `DimensionHandler` | Business entities | `stg.*` tables | `core.*` tables |
| **Core Merge** | `FactHandler` | Business events | `stg.*` tables | `core.*` tables |

### How Handlers Connect

#### 1. Raw Loader → Staging Transformer

**Data Flow:**
```
ExtractHandler (CSV parsing)
    ↓ produces
raw.* tables (text columns, lineage)
    ↓ consumed by
StagingExtractHandler (type conversion)
```

**Connection Points:**
- **Extract Type**: Both handlers use the same extract type identifier (`"Patient"`, `"Appointments"`, etc.)
- **Table Names**: Raw handlers output to `raw.{extract_type}`, staging handlers read from `raw.{extract_type}`
- **Lineage Preservation**: Raw handlers add audit columns that staging handlers preserve

#### 2. Staging Transformer → Core Merger

**Data Flow:**
```
StagingExtractHandler (validation & typing)
    ↓ produces
stg.* tables (typed, validated data)
    ↓ consumed by
DimensionHandler & FactHandler (business logic)
```

**Connection Points:**
- **Natural Keys**: Staging handlers define business keys that core handlers use for entity resolution
- **Data Types**: Staging ensures proper typing that core handlers can rely on
- **Validation**: Staging rejects invalid data, ensuring core handlers only process clean data

#### 3. End-to-End Handler Chain

For a single extract type (e.g., "Patient"):

```typescript
// 1. Raw Loader Handler
const rawHandler: ExtractHandler = {
  extractType: "Patient",
  tableName: "raw.patients",           // Output table
  columnMapping: ["patient_id", ...],  // CSV parsing
  validationRules: [/* basic rules */] // Basic validation
};

// 2. Staging Handler (reads from raw.patients)
const stagingHandler: StagingExtractHandler = {
  extractType: "Patient",
  sourceTable: "raw.patients",         // Input from raw loader
  targetTable: "stg.patients",         // Output table
  naturalKeys: ["patient_id", "practice_id"], // Business keys
  transformations: [/* type conversions */]
};

// 3. Core Dimension Handler (reads from stg.patients)
const patientDimensionHandler: PatientDimensionHandler = {
  dimension: "patient",
  sourceTable: "stg.patients",         // Input from staging
  targetTable: "core.dim_patients",    // Output table
  naturalKey: ["patient_id", "practice_id"], // From staging
  scd2Columns: ["is_active", "updated_at"] // SCD2 tracking
};
```

### Handler Coordination

#### Factory Pattern Consistency

Each pipeline stage uses a factory pattern for handler management:

```typescript
// Raw Loader
const rawFactory = new ExtractHandlerFactory();
const rawHandler = await rawFactory.getHandler("Patient");

// Staging Transformer
const stagingFactory = new StagingHandlerFactory();
const stagingHandler = await stagingFactory.getHandler("Patient");

// Core Merger (conceptual - not yet implemented)
const coreFactory = new CoreHandlerFactory();
const patientHandler = await coreFactory.getPatientHandler();
```

#### Configuration Inheritance

Handlers inherit and build upon previous stages:

- **Raw Handlers**: Define basic structure and validation
- **Staging Handlers**: Use raw table schemas, add type conversions
- **Core Handlers**: Use staging table schemas, add business logic

#### Error Propagation

Errors flow through the pipeline with increasing context:

```typescript
Raw Loading: "CSV parsing failed"
    ↓
Staging: "Invalid NHI format" + original CSV context
    ↓
Core Merge: "Duplicate patient ID" + staging validation context
```

### Key Handler Relationships

#### Same Extract Type, Different Stages

| Aspect | Raw Handler | Staging Handler | Core Handler |
|--------|-------------|-----------------|--------------|
| **Extract Type** | `"Patient"` | `"Patient"` | `"Patient"` |
| **Input** | CSV file | `raw.patients` | `stg.patients` |
| **Output** | `raw.patients` | `stg.patients` | `core.dim_patients` |
| **Focus** | Parsing | Transformation | Business Logic |
| **Validation** | Basic format | Business rules | Entity integrity |

#### Cross-Extract Dependencies

Some handlers depend on multiple extract types:

```typescript
// Immunisation handler depends on both Immunisation and Patient data
const immunisationHandler: ImmunisationFactHandler = {
  factType: "immunisation",
  sourceTables: {
    immunisation: "stg.immunisation",    // Main fact data
    patient: "stg.patients",             // Patient dimension
    vaccine: "stg.vaccine",              // Vaccine dimension
    provider: "stg.providers"            // Provider dimension
  },
  // Handler coordinates data from multiple staging tables
};
```

### Handler Lifecycle Coordination

#### Pipeline Execution Order

1. **Discovery**: Identifies files and extract types
2. **Raw Loading**: All extract types loaded in parallel
3. **Staging**: All extract types transformed (can be parallel)
4. **Core Merge**: Dimensions first, then facts (sequential dependencies)

#### Synchronization Points

- **Extract Type Level**: Each extract type processed independently
- **Pipeline Level**: Staging waits for all raw loading to complete
- **Dependency Level**: Fact handlers wait for required dimension handlers

### Monitoring Handler Connections

The system provides visibility into handler connections:

```typescript
// Track data flow between handlers
const pipelineMetrics = {
  rawToStaging: {
    extractType: "Patient",
    rawRows: 10000,
    stagingRows: 9500,
    rejectedRows: 500,
    processingTime: "2.5s"
  },
  stagingToCore: {
    extractType: "Patient",
    stagingRows: 9500,
    coreRows: 9500,  // SCD2 may create multiple versions
    processingTime: "1.8s"
  }
};
```

### Handler Development Patterns

#### Consistent Interface Design

All handlers follow similar patterns:

```typescript
interface BaseHandler {
  getExtractType(): string;        // What type of data
  getSourceTables(): string[];     // What it reads from
  getTargetTable(): string;        // What it writes to
  validateConfig(): boolean;       // Configuration validation
  process(options): Promise<Result>; // Main processing
}
```

#### Extension Points

- **Raw Handlers**: Custom parsing logic for complex CSV formats
- **Staging Handlers**: Custom transformation functions and validation rules
- **Core Handlers**: Custom business logic and SCD2 rules

This connected handler architecture ensures data flows smoothly through the pipeline while maintaining clear separation of concerns and comprehensive error handling at each stage.

## Handler Rules and Constraints

The ETL pipeline operates under strict rules that ensure data integrity, type safety, and consistent processing across all stages. These rules govern how handlers interact with schemas, how data flows between stages, and how naming conventions are maintained.

### Schema and Handler Synchronization Rules

#### Rule 1: Raw Schema ↔ Raw Handler Column Alignment

**Raw handler column mappings must exactly match raw schema column definitions.**

```typescript
// ✅ CORRECT: Handler columns match schema
// src/db/schema/raw/patients.ts
export const patientsRaw = createTable("raw.patients", {
  patientId: text("patient_id"),        // snake_case in DB
  nhiNumber: text("nhi_number"),
  // ... all columns defined as text
});

// src/services/raw-loader/handlers/patients-schema-handler.ts
columnMapping = [
  "patient_id",                         // snake_case matches schema
  "nhi_number",
  // ... exact same columns in same order
];
```

**Violation Example:**
```typescript
// ❌ WRONG: Column mismatch
columnMapping = [
  "patient_id",     // ✓ exists in schema
  "nhi",           // ❌ "nhi" doesn't exist, should be "nhi_number"
  "missing_col",   // ❌ doesn't exist in schema
];
```

#### Rule 2: Staging Schema Source Alignment

**Staging transformation source columns must match raw schema column names.**

```typescript
// ✅ CORRECT: Source columns match raw schema
// src/services/staging-transformer/configs/patients-transformations.ts
{
  sourceColumn: "patient_id",        // Matches raw.patients.patient_id
  targetColumn: "patientId",         // camelCase for staging
  targetType: ColumnType.TEXT,
},
{
  sourceColumn: "nhi_number",        // Matches raw.patients.nhi_number
  targetColumn: "nhiNumber",         // camelCase for staging
  targetType: ColumnType.TEXT,
}
```

### Naming Convention Rules

#### Rule 3: Database Column Naming (snake_case)

**All database columns use snake_case naming.**

| Stage | Table Pattern | Column Naming | Example |
|-------|---------------|---------------|---------|
| Raw | `raw.*` | snake_case | `patient_id`, `nhi_number` |
| Staging | `stg.*` | snake_case | `patient_id`, `nhi_number` |
| Core | `core.*` | snake_case | `patient_id`, `nhi_number` |

```sql
-- ✅ CORRECT: Consistent snake_case
CREATE TABLE raw.patients (
  patient_id TEXT,
  nhi_number TEXT,
  is_active TEXT
);

CREATE TABLE stg.patients (
  patient_id TEXT,
  nhi_number TEXT,
  is_active BOOLEAN  -- typed, but same name
);
```

#### Rule 4: Code Variable Naming (camelCase)

**Code variables and properties use camelCase naming.**

```typescript
// ✅ CORRECT: camelCase in code
interface Patient {
  patientId: string;     // Not patient_id
  nhiNumber: string;     // Not nhi_number
  isActive: boolean;     // Not is_active
}

// ❌ WRONG: snake_case in code
interface Patient {
  patient_id: string;    // Wrong!
  nhi_number: string;    // Wrong!
}
```

### Data Type Progression Rules

#### Rule 5: Type Evolution Chain

**Data types must follow the progression: text → typed → business types.**

| Stage | Data Types | Purpose | Example |
|-------|------------|---------|---------|
| **Raw** | `TEXT` only | Preserve source format | `"123"`, `"true"`, `"2024-01-15"` |
| **Staging** | Typed + constraints | Data validation | `123`, `true`, `Date object` |
| **Core** | Business types | Domain integrity | `PatientId`, `NhiNumber`, `ActiveStatus` |

```typescript
// ✅ CORRECT: Type progression
// Raw: All text
raw.patients.is_active = "true";      // TEXT column

// Staging: Proper types
stg.patients.is_active = true;        // BOOLEAN column

// Core: Business constraints
core.dim_patients.is_active = true;   // With domain constraints
```

#### Rule 6: Type Conversion Safety

**Type conversions must be safe and handle edge cases.**

```typescript
// ✅ CORRECT: Safe conversions
{
  sourceColumn: "is_active",
  targetColumn: "isActive",
  targetType: ColumnType.BOOLEAN,
  defaultValue: true,  // Safe default for invalid values
}

// ❌ WRONG: Unsafe conversion
{
  sourceColumn: "patient_id",
  targetColumn: "patientId",
  targetType: ColumnType.INTEGER,  // patient_id may contain letters!
}
```

### Extract Type Consistency Rules

#### Rule 7: Extract Type Matching

**Extract types must be consistent across all pipeline stages.**

```typescript
// ✅ CORRECT: Same extract type across stages
const rawHandler = { extractType: "Patient" };
const stagingHandler = { extractType: "Patient" };
const coreHandler = { extractType: "Patient" };

// ❌ WRONG: Mismatched extract types
const rawHandler = { extractType: "Patient" };
const stagingHandler = { extractType: "Patients" };  // Wrong!
```

#### Rule 8: Handler Registration

**All extract types must have registered handlers at each stage.**

```typescript
// ✅ CORRECT: All stages have Patient handlers
rawFactory.registerHandler(new PatientsRawHandler());
stagingFactory.registerHandler(new PatientsStagingHandler());
coreFactory.registerHandler(new PatientDimensionHandler());

// ❌ WRONG: Missing handler
rawFactory.registerHandler(new PatientsRawHandler());
stagingFactory.registerHandler(new PatientsStagingHandler());
// Missing: PatientDimensionHandler
```

### Table Naming Convention Rules

#### Rule 9: Table Prefix Rules

**Tables must follow strict naming conventions.**

| Stage | Prefix | Pattern | Examples |
|-------|--------|---------|----------|
| Raw | `raw.` | `raw.{extract_type}` | `raw.patients`, `raw.appointments` |
| Staging | `stg.` | `stg.{extract_type}` | `stg.patients`, `stg.appointments` |
| Core Dimensions | `core.dim_` | `core.dim_{entity}` | `core.dim_patients`, `core.dim_providers` |
| Core Facts | `core.fact_` | `core.fact_{event}` | `core.fact_appointments`, `core.fact_immunisations` |

```sql
-- ✅ CORRECT: Proper table naming
CREATE TABLE raw.patients (...);
CREATE TABLE stg.patients (...);
CREATE TABLE core.dim_patients (...);
CREATE TABLE core.fact_appointments (...);

-- ❌ WRONG: Incorrect naming
CREATE TABLE patients_raw (...);     -- Wrong prefix
CREATE TABLE staging.patients (...); -- Wrong schema
CREATE TABLE core.patients (...);    -- Wrong core pattern
```

### Natural Key and Relationship Rules

#### Rule 10: Natural Key Existence

**Natural keys defined in handlers must exist as columns in the source table.**

```typescript
// ✅ CORRECT: Natural keys exist in source table
const patientsHandler = {
  sourceTable: "stg.patients",
  naturalKeys: ["patient_id", "practice_id"],  // Both exist in stg.patients
  targetTable: "core.dim_patients",
};

// ❌ WRONG: Natural key doesn't exist
const patientsHandler = {
  naturalKeys: ["patient_uuid"],  // Doesn't exist in stg.patients!
};
```

#### Rule 11: Natural Key Immutability

**Natural keys must be immutable business identifiers.**

```typescript
// ✅ CORRECT: Business keys as natural keys
naturalKeys: ["patient_id", "practice_id"]    // Business identifiers
naturalKeys: ["nhi_number"]                   // Healthcare identifier
naturalKeys: ["appointment_id", "practice_id"] // Composite business key

// ❌ WRONG: Mutable fields as natural keys
naturalKeys: ["is_active"]      // Status can change
naturalKeys: ["updated_at"]     // Timestamp changes
naturalKeys: ["row_number"]     // Not a business identifier
```

### Validation and Business Rule Rules

#### Rule 12: Validation Rule Column References

**Validation rules must reference existing columns in the transformation.**

```typescript
// ✅ CORRECT: Validation references actual columns
{
  sourceColumn: "nhi_number",
  targetColumn: "nhiNumber",
  validationRules: [
    ValidationRuleBuilders.pattern("nhi_number", /^[A-Z]{3}\d{4}$/), // ✓ References sourceColumn
  ],
}

// ❌ WRONG: Validation references non-existent column
{
  sourceColumn: "nhi_number",
  validationRules: [
    ValidationRuleBuilders.required("nhi"),  // ❌ "nhi" doesn't exist
  ],
}
```

#### Rule 13: Business Rule Inheritance

**Business rules become stricter as data progresses through the pipeline.**

| Stage | Rule Strictness | Example |
|-------|----------------|---------|
| **Raw** | Minimal (format only) | Required fields, basic patterns |
| **Staging** | Moderate | Business validation, type safety |
| **Core** | Strictest | Referential integrity, complex business rules |

```typescript
// Raw: Basic validation only
validationRules: [
  ValidationRuleBuilders.required("patient_id"),  // Basic requirement
];

// Staging: Business validation
validationRules: [
  ValidationRuleBuilders.nhiFormat("nhi_number"),  // NZ-specific rule
  ValidationRuleBuilders.range("age", 0, 150),     // Business rule
];

// Core: Integrity constraints
// Enforced via database constraints, not validation rules
```

### Pipeline Execution Rules

#### Rule 14: Stage Execution Order

**Pipeline stages must execute in strict order with proper synchronization.**

```typescript
// ✅ CORRECT: Proper execution order
await discoveryService.discoverFiles();     // 1. Discover
await rawLoader.loadAllFiles();            // 2. Raw loading (parallel)
await stagingTransformer.transformAll();   // 3. Staging (parallel)
await coreMerger.mergeAll();               // 4. Core (sequential dependencies)

// ❌ WRONG: Incorrect order
await stagingTransformer.transformAll();   // Can't run before raw loading!
await coreMerger.mergeAll();               // Can't run before staging!
```

#### Rule 15: Idempotency Requirements

**All handlers must support idempotent execution.**

```typescript
// ✅ CORRECT: Idempotent operations
await rawLoader.loadFile(file, runId);     // Safe to re-run
await stagingTransformer.transform(runId); // Safe to re-run
await coreMerger.merge(runId);             // Safe to re-run

// System automatically prevents:
// - Duplicate raw file loading
// - Duplicate staging transformations
// - Duplicate core merges
```

### Error Handling and Monitoring Rules

#### Rule 16: Error Propagation Rules

**Errors must be logged and propagated with context at each stage.**

```typescript
// ✅ CORRECT: Rich error context
Raw Stage: "Failed to parse CSV: invalid separator at line 100"
Staging: "Invalid NHI format 'ABC123' in row 50 of raw.patients"
Core: "Foreign key violation: practice_id '999' not found in dim_practices"

// ❌ WRONG: Poor error context
"Error occurred"  // Not helpful!
```

#### Rule 17: Monitoring Data Consistency

**Handler metrics must maintain data consistency across stages.**

```typescript
// ✅ CORRECT: Consistent counts
const metrics = {
  raw: { patients: 10000, appointments: 5000 },
  staging: { patients: 9500, appointments: 4800 },  // Some rejected
  core: { patients: 9500, appointments: 4800 },     // All processed
};

// Total rows should balance (with known rejections)
raw.patients === staging.patients + staging.rejections.patients
```

### Development and Maintenance Rules

#### Rule 18: Schema Change Management

**Schema changes require coordinated updates across all affected handlers.**

```typescript
// When adding a new column to patients:

// 1. Update raw schema
// src/db/schema/raw/patients.ts
export const patientsRaw = createTable("raw.patients", {
  newField: text("new_field"),  // Add column
  // ... existing columns
});

// 2. Update raw handler
columnMapping = [
  "new_field",  // Add to mapping
  // ... existing mappings
];

// 3. Update staging transformations
{
  sourceColumn: "new_field",
  targetColumn: "newField",
  targetType: ColumnType.TEXT,
  // ... transformation rules
}

// 4. Update staging schema
// src/db/schema/stg/patients.ts
newField: text("new_field"),  // Add column
```

#### Rule 19: Testing Requirements

**All handlers must have comprehensive tests covering rule compliance.**

```typescript
// ✅ CORRECT: Test rules
describe("Patients Handler Rules", () => {
  it("should have all raw schema columns in mapping", () => {
    // Test Rule 1: Column alignment
  });

  it("should use correct naming conventions", () => {
    // Test Rules 3 & 4: Naming
  });

  it("should handle type conversions safely", () => {
    // Test Rule 6: Type safety
  });

  it("should validate natural key existence", () => {
    // Test Rule 10: Natural keys
  });
});
```

These rules ensure the ETL pipeline operates reliably, maintains data integrity, and provides consistent behavior across all extract types and processing stages. Violations of these rules can cause data corruption, processing failures, or inconsistent results.

## Staging Transformer

The Staging Transformer is the second stage of the ETL pipeline, responsible for transforming raw text data into properly typed staging tables with data validation and business rule enforcement.

### Purpose and Role

The Staging Transformer bridges the gap between raw data ingestion and core business logic:

```
Raw Loader → Raw Tables (text) → [Staging Transformer] → Staging Tables (typed) → Core Merger → Core Tables (business logic)
                    ↑ YOU ARE HERE
```

**Key Responsibilities:**
- **Type Conversion**: Transforms text columns to appropriate data types (dates, booleans, integers, decimals)
- **Data Validation**: Applies business rules and data quality checks
- **Rejection Handling**: Isolates invalid rows for analysis and remediation
- **Schema Standardization**: Converts column names and formats for consistency

### Handler-Based Architecture

Similar to the Raw Loader, the Staging Transformer uses a comprehensive handler system, but with a different focus on data transformation rather than parsing.

#### Staging Handler Structure

Each staging handler implements the `StagingExtractHandler` interface:

```typescript
interface StagingExtractHandler {
  extractType: string;           // Extract type (e.g., "Patient")
  sourceTable: string;           // Raw table (e.g., "raw.patients")
  targetTable: string;           // Staging table (e.g., "stg.patients")
  transformations: ColumnTransformation[]; // Column-by-column rules
  naturalKeys: string[];         // Business key columns for upsert
  uniqueConstraints?: string[][]; // Additional unique constraints
}
```

#### Transformation Rules

Each column gets a detailed transformation specification:

```typescript
interface ColumnTransformation {
  sourceColumn: string;          // Raw column name
  targetColumn: string;          // Staging column name (camelCase)
  targetType: ColumnType;        // Target data type
  required: boolean;             // NOT NULL constraint
  defaultValue?: any;            // Default for NULL/invalid values
  transformFunction?: TransformFunction; // Custom transformation logic
  validationRules?: ValidationRule[];    // Data quality rules
}
```

### Available Staging Handlers

| Extract Type | Handler Class | Source → Target | Key Transformations |
|--------------|---------------|-----------------|-------------------|
| **Patient** | `PatientStagingHandler` | `raw.patients` → `stg.patients` | Demographics, NHI validation, date parsing |
| **Appointments** | `AppointmentsStagingHandler` | `raw.appointments` → `stg.appointments` | Scheduling data, timestamps, status enums |
| **Providers** | `ProvidersStagingHandler` | `raw.providers` → `stg.providers` | Healthcare worker data, qualifications |
| **PracticeInfo** | `PracticeInfoStagingHandler` | `raw.practice_info` → `stg.practice_info` | Practice details, PHO information |
| **Medicine** | `MedicineStagingHandler` | `raw.medicine` → `stg.medicine` | Drug catalog, classifications |
| **Vaccine** | `VaccineStagingHandler` | `raw.vaccine` → `stg.vaccine` | Vaccine catalog, immunization schedules |
| **Immunisation** | `ImmunisationStagingHandler` | `raw.immunisation` → `stg.immunisation` | Vaccination records, batch tracking, NIR |
| **Diagnosis** | `DiagnosisStagingHandler` | `raw.diagnoses` → `stg.diagnoses` | Medical diagnoses, ICD-10/SNOMED mapping |

### Type Conversion System

The Staging Transformer performs sophisticated type conversions:

| Source (Text) | Target Type | Conversion Logic | Examples |
|---------------|-------------|------------------|----------|
| `"123"` | `INTEGER` | `parseInt(value)` | `"456"` → `456` |
| `"123.45"` | `DECIMAL` | `parseFloat(value)` | `"99.9"` → `99.9` |
| `"true"/"1"/"yes"` | `BOOLEAN` | Flexible parsing | `"false"` → `false` |
| `"2024-01-15"` | `DATE` | Date parsing | `"2024/01/15"` → `Date` |
| `"2024-01-15 10:30:00"` | `TIMESTAMP` | Timestamp parsing | Various formats supported |
| `"abc-123-def"` | `UUID` | UUID validation | Standard UUID formats |
| `'{"key":"value"}'` | `JSON` | JSON parsing | Valid JSON strings |

### Validation and Rejection System

#### Built-in Validators

```typescript
// Required field validation
ValidationRuleBuilders.required("patient_id");

// Format validation
ValidationRuleBuilders.nhiFormat("nhi_number");        // NZ NHI format: ABC1234
ValidationRuleBuilders.email("email_address");         // Email format
ValidationRuleBuilders.pattern("phone", /^\+?\d+$/);   // Phone number pattern

// Range and constraint validation
ValidationRuleBuilders.range("age", 0, 150);          // Age between 0-150
ValidationRuleBuilders.length("postal_code", 4, 10);  // String length
ValidationRuleBuilders.enum("status", ["active", "inactive", "pending"]);

// Business rule validation
ValidationRuleBuilders.futureDate("appointment_date"); // Must be future date
```

#### Rejection Handling

Invalid rows are captured in the `etl.staging_rejections` table:

```sql
CREATE TABLE etl.staging_rejections (
  rejection_id SERIAL PRIMARY KEY,
  load_run_id UUID NOT NULL,
  extract_type TEXT NOT NULL,
  row_number INTEGER,
  source_row_id TEXT,
  rejection_reason TEXT NOT NULL,
  validation_failures JSONB,     -- Detailed validation errors
  raw_data JSONB,               -- Original row data for debugging
  rejected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Rejection Analysis:**
```typescript
const summary = rejectionHandler.buildRejectionSummary(result.rejections);

console.log(`Total rejections: ${summary.totalRejections}`);
console.log("Top reasons:", summary.topReasons);     // Most common failure reasons
console.log("By column:", summary.byColumn);         // Failures grouped by column
```

### Handler Factory Pattern

The `StagingHandlerFactory` manages handler registration and instantiation:

```typescript
// Factory initialization with default handlers
const factory = new StagingHandlerFactory();

// Get handler for extract type
const patientHandler = await factory.getHandler("Patient");

// Register custom handler
await factory.registerHandler(customPatientHandler);
```

### Transformation Configuration

Each handler uses detailed transformation configurations. Example from patients:

```typescript
export const patientsTransformations: ColumnTransformation[] = [
  // ID fields - remain as text
  {
    sourceColumn: "patient_id",
    targetColumn: "patientId",
    targetType: ColumnType.TEXT,
    required: true,
  },

  // Boolean conversions with defaults
  {
    sourceColumn: "is_active",
    targetColumn: "isActive",
    targetType: ColumnType.BOOLEAN,
    required: false,
    defaultValue: true,  // Default to active
  },

  // Date parsing
  {
    sourceColumn: "dob",
    targetColumn: "dob",
    targetType: ColumnType.DATE,
    required: false,
  },

  // Numeric conversions
  {
    sourceColumn: "age",
    targetColumn: "age",
    targetType: ColumnType.INTEGER,
    required: false,
  },
];
```

### Upsert and Natural Keys

Staging tables use upsert logic based on natural business keys:

```typescript
const patientHandler: StagingExtractHandler = {
  extractType: "Patient",
  sourceTable: "raw.patients",
  targetTable: "stg.patients",
  naturalKeys: ["patient_id", "practice_id", "per_org_id"], // Business key
  transformations: patientsTransformations,
};
```

This enables:
- **Deduplication**: Multiple raw records for same business entity
- **Change Tracking**: Updates to existing records
- **Data Freshness**: Latest version wins based on load timestamp

### Performance and Scalability

#### Batch Processing
- Configurable batch sizes for optimal throughput
- Memory-efficient streaming for large datasets
- Concurrent processing of multiple extract types

#### Monitoring and Metrics
```typescript
const result: TransformResult = {
  totalRowsRead: 10000,
  totalRowsTransformed: 9500,
  totalRowsRejected: 500,
  successfulBatches: 20,
  failedBatches: 0,
  rowsPerSecond: 1250,
  memoryUsageMB: 256,
  // ... detailed metrics
};
```

### Error Handling and Recovery

#### Comprehensive Error Categories
- **Type Conversion Errors**: Invalid data formats
- **Validation Failures**: Business rule violations
- **Constraint Violations**: Database integrity issues
- **Memory/Performance Issues**: Resource exhaustion

#### Recovery Strategies
- **Continue on Error**: Process remaining rows when individual rows fail
- **Batch Isolation**: Failed batches don't affect others
- **Detailed Logging**: Complete audit trail for troubleshooting
- **Rejection Analysis**: Tools to understand and fix data quality issues

### Integration with ETL Pipeline

The Staging Transformer serves as the critical bridge between raw data ingestion and business logic:

```
Raw Loader → Raw Tables (text, unvalidated)
    ↓
Staging Transformer → Staging Tables (typed, validated, deduplicated)
    ↓
Core Merger → Core Tables (business entities, SCD2 history)
```

**Data Flow Guarantees:**
- **Type Safety**: All columns have correct data types
- **Data Quality**: Invalid rows isolated and analyzable
- **Business Rules**: Domain constraints enforced
- **Audit Trail**: Complete lineage from source to core
- **Idempotency**: Safe to re-run transformations

### Custom Handler Development

For special transformation requirements:

```typescript
export class CustomPatientHandler implements StagingExtractHandler {
  extractType = "Patient";
  sourceTable = "raw.patients";
  targetTable = "stg.patients";
  naturalKeys = ["patient_id", "practice_id"];

  transformations: ColumnTransformation[] = [
    // Standard transformations...
    {
      sourceColumn: "full_name",
      targetColumn: "fullName",
      targetType: ColumnType.TEXT,
      transformFunction: (value) => {
        // Custom: uppercase and trim
        return String(value).toUpperCase().trim();
      },
    },
    {
      sourceColumn: "nhi_number",
      targetColumn: "nhiNumber",
      targetType: ColumnType.TEXT,
      validationRules: [
        ValidationRuleBuilders.nhiFormat("nhi_number"),
        // Custom validation
        {
          name: "duplicate_check",
          type: ValidationType.CUSTOM,
          validator: async (value) => {
            return !(await nhiExistsInSystem(value));
          },
          errorMessage: "NHI number already exists in system",
          severity: "error",
        },
      ],
    },
  ];
}
```

This handler-based architecture provides flexibility, maintainability, and comprehensive data quality assurance throughout the ETL pipeline.

