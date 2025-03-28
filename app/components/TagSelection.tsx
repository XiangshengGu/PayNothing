import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Image } from "react-native";
import { ItemTag } from "../data/models";

const TAGS = Object.values(ItemTag);
interface TagSelectorProps {
    onTagsSelected: (tags: string[]) => void;
}

export default function TagSelector({ onTagsSelected }: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [preSelected, setPreSelected] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const numsTagLimit = 3;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
        if (prev.includes(tag)) {
            return prev.filter(t => t !== tag);
        }
        else if (prev.length < numsTagLimit) {
            return [...prev, tag];
        }
        return prev;
    });
  };

  const handleConfirm = () => {
    setPreSelected([...selectedTags]);
    onTagsSelected(selectedTags);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setSelectedTags([...preSelected]);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* outside of dialog: show selected tags */}
      <TouchableOpacity 
        style={styles.tagRow}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.tagRowContent}>
          <View style={styles.outSideTagTile}>
            <View style={styles.tagTitleContainer}>
              <Image 
                source={require("../../assets/images/tag-label.png")} 
                style={styles.icons}
              />
              <Text style={styles.tagTitleText}>Tags</Text>
            </View>
          <Image 
            source={require("../../assets/images/tag-arrow.png")} 
            style={styles.icons}
          />
        </View>
    
        <View style={styles.outSideTags}>
          {selectedTags.length > 0 ? (
            <View style={styles.tagContainer}>
              {selectedTags.map(tag => (
                <View key={tag} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select Tags</Text>
          )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Dialog */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => handleCancel()}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tags</Text>
              <Text style={styles.tagLimitText}>Up to {numsTagLimit - selectedTags.length} more tags can be added</Text>
            </View>

            {/* show selected tags */}
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                {selectedTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.modalSelectedTag}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={styles.modalSelectedTagText}>{tag} ×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recommend Tag */}
            <Text style={styles.sectionTitle}>Recommended tags</Text>
            <FlatList
              data={TAGS}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tagButton,
                    selectedTags.includes(item) && styles.tagButtonSelected
                  ]}
                  onPress={() => toggleTag(item)}
                >
                  <Text style={[
                    styles.tagButtonText,
                    selectedTags.includes(item) && styles.tagButtonTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Buttons for dialog */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => handleCancel()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => handleConfirm()}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginVertical: 12,
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  tagRow: {
    backgroundColor: 'white',
    marginVertical: 12,
  },
  tagRowContent: {
    flexDirection: 'column',
  },
  outSideTagTile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tagTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagTitleText: {
    fontSize: 14,
    color: 'rgb(0, 0, 0)',
  },
  icons: {
    width: 15,
    height: 15,
  },
  outSideTags: {
    padding: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    backgroundColor: 'rgb(240,240,240)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedTagText: {
    color: 'rgb(51,51,51)',
    fontSize: 11,
  },
  placeholderText: {
    color: 'rgb(153,153,153)',
    fontSize: 14,
  },
  // dialog
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagLimitText: {
    color: 'rgb(153,153,153)',
    fontSize: 14,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalSelectedTag: {
    backgroundColor: 'rgb(255,249,196)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalSelectedTagText: {
    color: 'rgb(51,51,51)',
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'rgb(51,51,51)',
  },
  tagButton: {
    flex: 1,
    margin: 4,
    padding: 10,
    backgroundColor: 'rgb(245,245,245)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%',
  },
  tagButtonSelected: {
    backgroundColor: 'rgb(255,249,196)',
    borderColor: 'rgb(255,214,0)',
    borderWidth: 1,
  },
  tagButtonText: {
    color: 'rgb(102,102,102)',
    fontSize: 10,
  },
  tagButtonTextSelected: {
    color: 'rgb(51,51,51)',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgb(238,238,238)',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    backgroundColor: 'rgb(245,245,245)',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgb(102,102,102)',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    padding: 12,
    backgroundColor: 'rgb(255,214,0)',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'rgb(51,51,51)',
    fontWeight: 'bold',
  },
});