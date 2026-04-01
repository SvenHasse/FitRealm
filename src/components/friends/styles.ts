// styles.ts
// Shared styles for the Freunde tab (Stamm, Freundesliste, Einladen).
// Accent color: Sage Green (#7D9B76)

import { StyleSheet } from 'react-native';
import { AppColors } from '../../models/types';

const SAGE = '#7D9B76';
const CARD = AppColors.cardBackground; // '#252547'
const BG   = AppColors.background;     // '#1A1A2E'

export const friendStyles = StyleSheet.create({
  // container / layout
  container: { flex: 1, backgroundColor: BG },
  content:   { padding: 16, paddingBottom: 32 },
  section:   { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 10 },

  // cards
  card: {
    backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: AppColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  // buttons
  primaryButton: {
    backgroundColor: SAGE, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: AppColors.textPrimary },

  // text input
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: AppColors.textPrimary, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 6,
  },

  // avatar
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // rival card
  rivalCard: {
    backgroundColor: 'rgba(245,166,35,0.10)', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(245,166,35,0.35)',
  },
  rivalLabel:   { fontSize: 12, fontWeight: '700', color: AppColors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  rivalContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rivalInfo:    { flex: 1 },
  rivalName:    { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary },
  rivalMM:      { fontSize: 13, color: AppColors.textSecondary, marginTop: 2 },
  rivalDiff:    { fontSize: 18, fontWeight: '800' },

  // ghost / streak danger
  ghostCard: {
    backgroundColor: 'rgba(192,57,43,0.12)', borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(192,57,43,0.35)',
  },
  motivateButton:     { backgroundColor: '#C0392B', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  motivateButtonSent: { backgroundColor: SAGE },
  motivateButtonText: { fontSize: 20 },

  // friend card
  friendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 8,
  },
  friendName:   { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  friendStatus: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  friendStats:  { alignItems: 'flex-end', gap: 4 },
  friendMM:     { fontSize: 14, fontWeight: '700', color: AppColors.gold },
  friendStreak: { fontSize: 12, color: AppColors.textSecondary },

  // leaderboard
  leaderboardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    paddingHorizontal: 14, borderRadius: 12, marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  leaderboardRowMe: { backgroundColor: `${SAGE}22`, borderWidth: 1, borderColor: `${SAGE}55` },
  leaderboardRank:  { fontSize: 18, width: 36, textAlign: 'center' },
  leaderboardName:  { flex: 1, fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  leaderboardMM:    { fontSize: 14, fontWeight: '700', color: AppColors.gold },
  myPositionBadge:  { fontSize: 13, fontWeight: '700', color: SAGE },

  // invite code
  codeCard: {
    backgroundColor: CARD, borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center',
    borderWidth: 1, borderColor: `${SAGE}40`,
  },
  codeLabel:       { fontSize: 11, fontWeight: '800', color: SAGE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  codeValue:       { fontSize: 40, fontWeight: '900', color: AppColors.textPrimary, letterSpacing: 6, marginBottom: 16 },
  copyButton:      { backgroundColor: SAGE, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28 },
  copyButtonText:  { fontSize: 15, fontWeight: '700', color: '#fff' },

  // stats (invite screen)
  statsCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 14 },
  statsRow:  { flexDirection: 'row', gap: 10, marginTop: 8 },
  statBox:   { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
  statBoxValue: { fontSize: 28, fontWeight: '800', color: AppColors.gold },
  statBoxLabel: { fontSize: 11, color: AppColors.textSecondary, marginTop: 4, textAlign: 'center' },
  pendingHint:  { fontSize: 12, color: AppColors.textSecondary, marginTop: 10, textAlign: 'center' },

  // share button
  shareButton:     { backgroundColor: AppColors.teal, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  shareButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // how it works
  howItWorksCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 14 },
  howItWorksRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  howItWorksIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  howItWorksText: { flex: 1, fontSize: 14, color: AppColors.textSecondary, lineHeight: 20 },

  // tribe header
  tribeHeader:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 14 },
  tribeEmblem:    { fontSize: 40 },
  tribeName:      { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary },
  tribeMeta:      { fontSize: 12, color: AppColors.textSecondary, marginTop: 3 },
  buffBadge:      { marginLeft: 'auto', backgroundColor: `${SAGE}30`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${SAGE}60` },
  buffBadgeText:  { fontSize: 13, fontWeight: '700', color: SAGE },

  // members
  memberRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  memberRank:       { fontSize: 14, fontWeight: '700', color: AppColors.textSecondary, width: 28 },
  memberAvatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  memberInfo:       { flex: 1 },
  memberName:       { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  memberMeta:       { fontSize: 12, color: AppColors.textSecondary },
  memberMM:         { fontSize: 14, fontWeight: '700', color: AppColors.gold },

  // quest
  questDescription: { fontSize: 14, color: AppColors.textPrimary, marginBottom: 10, lineHeight: 20 },
  questFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  questProgress:    { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  questReward:      { fontSize: 13, fontWeight: '600', color: AppColors.gold },

  // join code display
  joinCodeDisplay: { fontSize: 32, fontWeight: '900', color: SAGE, textAlign: 'center', letterSpacing: 6, marginVertical: 12 },
  joinCodeHint:    { fontSize: 12, color: AppColors.textSecondary, textAlign: 'center' },

  // placeholder (no stammeshaus / no tribe)
  centeredPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  placeholderEmoji:    { fontSize: 60, marginBottom: 16 },
  placeholderTitle:    { fontSize: 20, fontWeight: '700', color: AppColors.textPrimary, textAlign: 'center', marginBottom: 8 },
  placeholderText:     { fontSize: 14, color: AppColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  placeholderHint:     { fontSize: 13, color: AppColors.textSecondary, textAlign: 'center', opacity: 0.7 },

  // progress bar
  progressBarContainer: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginVertical: 8 },
  progressBarFill:      { height: '100%', backgroundColor: SAGE, borderRadius: 4 },
  progressBarFillQuest: { height: '100%', backgroundColor: AppColors.gold, borderRadius: 4 },
  progressLabel:        { fontSize: 12, color: AppColors.textSecondary, textAlign: 'right' },

  // emblem picker
  emblemGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  emblemOption:          { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  emblemOptionSelected:  { borderColor: SAGE, backgroundColor: `${SAGE}22` },

  // tribe type selector
  typeRow:              { flexDirection: 'row', gap: 10, marginTop: 6 },
  typeOption:           { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'transparent' },
  typeOptionSelected:   { borderColor: SAGE, backgroundColor: `${SAGE}18` },
  typeOptionText:       { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary, marginBottom: 4 },
  typeOptionDesc:       { fontSize: 11, color: AppColors.textSecondary },

  // form
  formContainer: { flex: 1, padding: 20 },
  formTitle:     { fontSize: 22, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 20 },
  formLabel:     { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.6 },

  // tab bar (inner tabs)
  tabBar:          { flexDirection: 'row', backgroundColor: CARD, marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 14, padding: 4 },
  tabItem:         { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabItemActive:   { backgroundColor: SAGE },
  tabLabel:        { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  tabLabelActive:  { color: '#fff', fontWeight: '700' },

  // tribe container
  tribeContainer: { flex: 1, padding: 16 },
  emptyHint:      { fontSize: 14, color: AppColors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  ghostSection:   { marginBottom: 16 },
});
