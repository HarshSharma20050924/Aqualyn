import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  Modal, 
  ActivityIndicator, 
  StyleSheet, 
  Platform, 
  Dimensions 
} from 'react-native';
import { X, UserPlus, Search } from 'lucide-react-native';
import { User } from '../../types';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLoading: boolean;
  onUserClick?: (user: User) => void;
}

export default function UserListModal({ isOpen, onClose, title, users, isLoading, onUserClick }: UserListModalProps) {
  const [search, setSearch] = useState('');
  
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => 
      (u.displayName || '').toLowerCase().includes(q) || 
      (u.username || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Dismiss Backdrop Overlay Area */}
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{users.length} Users</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={16} color="#94A3B8" />
              <TextInput 
                placeholder={`Search ${title}...`}
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
          </View>
          
          {/* Main User List Container */}
          <ScrollView contentContainerStyle={styles.scrollContent} style={styles.flex1}>
            {isLoading ? (
               <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0284C7" />
                  <Text style={styles.loadingText}>Synchronizing Identity</Text>
               </View>
            ) : filteredUsers.length > 0 ? (
               filteredUsers.map(u => (
                  <TouchableOpacity 
                    key={u.id} 
                    style={styles.userItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (onUserClick) onUserClick(u);
                      onClose();
                    }}
                  >
                    <View style={styles.userInfo}>
                       <View style={styles.avatarContainer}>
                          {u.avatar ? (
                            <Image source={{ uri: u.avatar }} style={styles.avatarImage as any} />
                          ) : (
                            <Text style={styles.avatarPlaceholderText}>{(u.displayName || u.username).charAt(0).toUpperCase()}</Text>
                          )}
                       </View>
                       <View style={styles.userDetails}>
                          <Text style={styles.userName} numberOfLines={1}>{u.displayName || u.username}</Text>
                          <Text style={styles.userUsername}>@{u.username}</Text>
                       </View>
                    </View>
                    <View style={styles.badge}>
                       <Text style={styles.badgeText}>Profile</Text>
                    </View>
                  </TouchableOpacity>
               ))
            ) : (
               <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                     <UserPlus size={32} color="#cbd5e1" />
                  </View>
                  <View style={styles.emptyTextContainer}>
                     <Text style={styles.emptyTitle}>No Results</Text>
                     <Text style={styles.emptySubtitle}>We couldn't find anyone matching your search in this list.</Text>
                  </View>
               </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: WINDOW_WIDTH > 640 ? 440 : undefined,
    height: '85%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textTransform: 'capitalize',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    padding: 0,
  },
  scrollContent: {
    padding: 16,
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 80,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  userDetails: {
    minWidth: 0,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#0f172a',
    fontSize: 16,
  },
  userUsername: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTextContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    maxWidth: 200,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});