import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import {scale} from 'react-native-size-matters';
import {COLORS} from '../../res/colors';
import TextComp from './textComp';
import Icon from '../../utils/icon';

const CustomDropdown = ({
  items = [],
  selectedValue,
  onValueChange,
  placeholder = 'Select',
  containerStyle = {},
  dropdownStyle = {},
  itemStyle = {},
  listContainerStyle = {},
  label,
  labelStyle,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSelect = item => {
    onValueChange(item);
    setVisible(false);
    setSearchText('');
  };

  const filteredItems = useMemo(() => {
    if (label === 'State' && searchText.trim() !== '') {
      return items.filter(item =>
        item.label.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
    return items;
  }, [items, searchText, label]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <TextComp
          style={[styles.label, {color: COLORS.primaryTextColor}, labelStyle]}>
          {label}
        </TextComp>
      )}
      <TouchableOpacity
        style={[
          styles.dropdown,
          dropdownStyle,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
        ]}
        onPress={() => setVisible(!visible)}
        activeOpacity={0.8}>
        <TextComp style={styles.selectedText} allowFontScaling={false}>
          {selectedValue?.label || placeholder}
        </TextComp>
        <Icon
          type="Ionicons"
          name={visible ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color={COLORS.primaryTextColor}
        />
      </TouchableOpacity>

      {visible && (
        <View style={[styles.dropdownList, listContainerStyle]}>
          {label === 'State' && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search state..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          )}
          <FlatList
            data={filteredItems}
            keyExtractor={item => item.value.toString()}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.item, itemStyle]}
                onPress={() => handleSelect(item)}>
                <Text style={styles.itemText} allowFontScaling={false}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    padding: scale(14),
    borderRadius: scale(8),
    backgroundColor: COLORS.white,
  },
  selectedText: {
    fontSize: scale(14),
    color: '#8e9aab',
    fontWeight: '400',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: COLORS.primaryTextColor,
    borderRadius: scale(8),
    backgroundColor: COLORS.white,
    marginTop: 4,
    maxHeight: scale(200),
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: scale(23),
    borderBottomWidth: 1,
    borderColor: '#8e9aab',
  },
  itemText: {
    fontSize: scale(16),
    color: COLORS.primaryTextColor,
  },
  searchInput: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    fontSize: scale(14),
    color: COLORS.primaryTextColor,
  },
});
