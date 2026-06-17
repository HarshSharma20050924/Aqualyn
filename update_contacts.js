const fs = require('fs');

let content = fs.readFileSync('/home/harsh/Aqualyn/aqualyn-mobile/src/screens/ContactsScreen.tsx', 'utf8');

content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';\nimport * as Contacts from 'expo-contacts';\nimport * as SMS from 'expo-sms';");

content = content.replace("const [searchQuery, setSearchQuery] = useState('');", `const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<Contacts.Contact[]>([]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          });
          setDeviceContacts(data);
        }
      }
    })();
  }, []);`);

const oldHandleInvite = `  const handleInvite = async () => {
    try {
      await Share.share({
        title: 'Join Aqualyn',
        message: 'Hey! Join me on Aqualyn, the best messaging app. https://aqualyn.io/invite',
      });
    } catch (error) {
      // Fallback if sharing fails or is unsupported on the environment
      addToast('Could not open share sheet', 'error');
    }
  };`;

const newHandleInvite = `  const handleInvite = async (phoneNumber?: string) => {
    try {
      if (phoneNumber && await SMS.isAvailableAsync()) {
        await SMS.sendSMSAsync(
          [phoneNumber],
          'Hey! Join me on Aqualyn, the best messaging app. https://aqualyn.io/invite'
        );
      } else {
        await Share.share({
          title: 'Join Aqualyn',
          message: 'Hey! Join me on Aqualyn, the best messaging app. https://aqualyn.io/invite',
        });
      }
    } catch (error) {
      addToast('Could not open share sheet', 'error');
    }
  };`;

content = content.replace(oldHandleInvite, newHandleInvite);

// Update getFilteredList to include device contacts
const oldGetFilteredList = `    if (activeTab === 'contacts') {
      return contacts.filter(c => (c.name || '').toLowerCase().includes(query));
    }`;

const newGetFilteredList = `    if (activeTab === 'contacts') {
      // Get app contacts
      const appContacts = contacts.map(c => ({
         ...c,
         isDeviceOnly: false,
         phoneNumber: c.phone
      }));
      
      // Get device contacts not in app contacts
      // For simplicity, we just filter out device contacts whose name matches an app contact
      // or whose phone matches (if we have phone numbers for app contacts)
      const appContactNames = new Set(appContacts.map(c => c.name?.toLowerCase()));
      const unmappedDeviceContacts = deviceContacts
         .filter(dc => dc.name && !appContactNames.has(dc.name.toLowerCase()))
         .map(dc => ({
            id: \`device-\${dc.id}\`,
            name: dc.name,
            avatar: dc.imageAvailable && dc.image ? dc.image.uri : \`https://api.dicebear.com/7.x/initials/svg?seed=\${dc.name}\`,
            role: 'From Device Contacts',
            isDeviceOnly: true,
            phoneNumber: dc.phoneNumbers?.[0]?.number
         }));

      return [...appContacts, ...unmappedDeviceContacts].filter(c => (c.name || '').toLowerCase().includes(query));
    }`;

content = content.replace(oldGetFilteredList, newGetFilteredList);

// Update render list to show Invite button for device contacts
const oldRenderContact = `            {currentList.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                onPress={() => handleContactClick(contact.id)}
                style={styles.contactItemCardRow}
              >
                <View style={styles.contactAvatarFrameBox}>
                  <Image source={{ uri: contact.avatar }} style={styles.contactAvatarImage} />
                </View>
                <View style={styles.contactMetaInfoBlock}>
                  <Text numberOfLines={1} style={styles.contactNameHeadlineText}>
                    {contact.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.contactSubtitleRoleText}>
                    {contact.role}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}`;

const newRenderContact = `            {currentList.map((contact: any) => (
              <TouchableOpacity
                key={contact.id}
                onPress={() => contact.isDeviceOnly ? handleInvite(contact.phoneNumber) : handleContactClick(contact.id)}
                style={styles.contactItemCardRow}
              >
                <View style={styles.contactAvatarFrameBox}>
                  <Image source={{ uri: contact.avatar }} style={styles.contactAvatarImage} />
                </View>
                <View style={styles.contactMetaInfoBlock}>
                  <Text numberOfLines={1} style={styles.contactNameHeadlineText}>
                    {contact.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.contactSubtitleRoleText}>
                    {contact.role}
                  </Text>
                </View>
                {contact.isDeviceOnly && (
                  <TouchableOpacity onPress={() => handleInvite(contact.phoneNumber)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0057bd' }}>Invite</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}`;

content = content.replace(oldRenderContact, newRenderContact);

fs.writeFileSync('/home/harsh/Aqualyn/aqualyn-mobile/src/screens/ContactsScreen.tsx', content);
