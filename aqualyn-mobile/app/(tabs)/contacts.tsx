import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import { Theme } from '../../src/config/theme';
import { Search, UserPlus, MoreVertical, MessageCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { User } from '../../src/types';

export default function ContactsScreen() {
  const { contacts, globalUsers, startChatWithContact } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = (contacts || []).filter((c: User) => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContactItem = ({ item }: { item: User }) => (
    <View style={styles.contactItem}>
      <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>{item.displayName || item.name}</Text>
        <Text style={styles.contactUsername}>@{item.username || item.name}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => startChatWithContact(item.id)}
        >
          <MessageCircle size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MoreVertical size={20} color={Theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.header}>
          <Text style={styles.headerTitle}>Contacts</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <UserPlus size={22} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.header, { backgroundColor: Theme.colors.surface }]}>
          <Text style={styles.headerTitle}>Contacts</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <UserPlus size={22} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <UserPlus size={48} color={Theme.colors.surfaceVariant} />
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.onSurface,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  contactItem: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.onSurface,
    marginBottom: 2,
  },
  contactUsername: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: Theme.spacing.md,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 16,
  },
});
