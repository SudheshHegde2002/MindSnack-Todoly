import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    header: {
      alignItems: 'center',
      marginBottom: 64,
    },
    title: {
      fontSize: 48,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 12,
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '400',
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 400,
      gap: 16,
    },
    primaryButton: {
      backgroundColor: '#6366F1',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#6366F1',
    },
    secondaryButtonText: {
      color: '#6366F1',
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
      color: '#6B7280',
    },
    footerLink: {
      fontSize: 14,
      color: '#6366F1',
      fontWeight: '600',
    },
  });
  
  