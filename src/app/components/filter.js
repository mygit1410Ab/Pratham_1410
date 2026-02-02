import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '../../utils/icon';
import TextComp from './textComp';
import { scale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../../res/colors';

const priceRanges = [
  { name: 'Under ₹500', min: 0, max: 500 },
  { name: '₹500 - ₹1000', min: 500, max: 1000 },
  { name: '₹1000 - ₹2000', min: 1000, max: 2000 },
  { name: 'Above ₹2000', min: 2000, max: 999999 },
];

const filterOptions = ['Brand', 'Price'];

const FilterModal = ({
  visible,
  onClose,
  brands = [],
  onApply,
  setSelectedBrandsObj,
  selectedBrands,
  setSelectedBrands,
  selectedPrice,
  setSelectedPrice,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('Brand');

  const toggleBrand = useCallback((item) => {
    if (!item?.id) return;

    const numericId = Number(item.id);
    if (isNaN(numericId)) return;

    setSelectedBrandsObj((prev) => {
      const isSelected = prev?.some((b) => b.id === item.id);
      const updatedBrandsObj = isSelected
        ? prev.filter((b) => b.id !== item.id)
        : [...(prev || []), item];

      setSelectedBrands(updatedBrandsObj.map((b) => Number(b.id)));
      return updatedBrandsObj;
    });
  }, [setSelectedBrands, setSelectedBrandsObj]);

  const handleApply = useCallback(() => {
    const filterData = {
      brands: selectedBrands.map(Number),
      price_range: null,
    };

    if (selectedPrice) {
      const selectedRange = priceRanges.find((range) => range.name === selectedPrice);
      if (selectedRange) {
        filterData.price_range = { min: selectedRange.min, max: selectedRange.max };
      }
    }

    onApply(filterData);
    onClose();
  }, [selectedBrands, selectedPrice, onApply, onClose]);

  const handleClear = useCallback(() => {
    setSelectedBrands([]);
    setSelectedPrice(null);
    setSelectedBrandsObj([]);
    onApply({ brands: [], price_range: null });
    onClose();
  }, [setSelectedBrands, setSelectedPrice, setSelectedBrandsObj, onApply, onClose]);

  const renderFilterContent = () => {
    switch (selectedFilter) {
      case 'Brand':
        return (
          <View style={styles.optionContainer}>
            {brands.map((brand) => (
              <TouchableOpacity
                key={brand.id}
                onPress={() => toggleBrand(brand)}
                style={styles.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityLabel={`Select ${brand.name}`}>
                <TextComp style={styles.checkboxLabel}>{brand.name}</TextComp>
                <Icon
                  type="AntDesign"
                  name={
                    selectedBrands.includes(Number(brand.id))
                      ? 'checkcircle'
                      : 'checkcircleo'
                  }
                  size={scale(20)}
                  color={
                    selectedBrands.includes(Number(brand.id))
                      ? COLORS.primaryAppColor
                      : '#ccc'
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'Price':
        return (
          <View style={styles.optionContainer}>
            {priceRanges.map((range) => (
              <TouchableOpacity
                key={range.name}
                onPress={() => setSelectedPrice(range.name)}
                style={styles.checkboxRow}
                accessibilityRole="radio"
                accessibilityLabel={`Select price range ${range.name}`}>
                <Icon
                  type="AntDesign"
                  name={selectedPrice === range.name ? 'checkcircle' : 'checkcircleo'}
                  size={scale(20)}
                  color={selectedPrice === range.name ? COLORS.primaryAppColor : '#ccc'}
                />
                <TextComp style={styles.checkboxLabel}>{range.name}</TextComp>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filter modal">
              <Icon type="AntDesign" name="close" size={scale(24)} />
            </TouchableOpacity>
            <TextComp style={styles.headerTitle}>Filter</TextComp>
            <View style={{ width: scale(24) }} />
          </View>

          <View style={styles.body}>
            <View style={styles.leftPanel}>
              {filterOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setSelectedFilter(item)}
                  style={[
                    styles.filterItem,
                    selectedFilter === item && styles.activeFilterItem,
                  ]}
                  accessibilityRole="tab"
                  accessibilityLabel={`Select ${item} filter`}>
                  {selectedFilter === item && <View style={styles.activeBar} />}
                  <TextComp
                    style={{
                      color: selectedFilter === item ? '#000' : '#666',
                      fontWeight: selectedFilter === item ? '700' : '500',
                    }}>
                    {item}
                  </TextComp>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.rightPanel}>{renderFilterContent()}</ScrollView>
          </View>

          <View style={[styles.footer, { paddingBottom: verticalScale(28) }]}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters">
              <TextComp style={{ color: COLORS.white }}>Clear</TextComp>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters">
              <TextComp style={{ color: COLORS.secondaryAppColor }}>Apply</TextComp>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    height: verticalScale(Dimensions.get('window').height * 0.65),
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    borderBottomWidth: 1,
    borderColor: '#eee',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: scale(21),
    fontWeight: 'bold',
    color: COLORS.secondaryAppColor,
  },
  body: {
    flexDirection: 'row',
    flex: 1,
  },
  leftPanel: {
    width: '30%',
    backgroundColor: '#f0f0f0',
  },
  rightPanel: {
    width: '70%',
    padding: scale(10),
  },
  filterItem: {
    paddingVertical: scale(15),
    paddingHorizontal: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterItem: {
    backgroundColor: '#e0e0e0',
  },
  activeBar: {
    width: scale(5),
    height: '100%',
    backgroundColor: COLORS.primaryAppColor,
    marginRight: scale(10),
    borderTopRightRadius: scale(5),
    borderBottomRightRadius: scale(5),
  },
  optionContainer: {
    paddingVertical: scale(10),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    justifyContent: 'space-between',
    paddingRight: scale(7),
  },
  checkboxLabel: {
    marginLeft: scale(10),
    fontSize: scale(16),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: scale(15),
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: COLORS.secondaryAppColor,
  },
  clearBtn: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: scale(8),
  },
  applyBtn: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

FilterModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  brands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  onApply: PropTypes.func.isRequired,
  setSelectedBrandsObj: PropTypes.func.isRequired,
  selectedBrandsObj: PropTypes.array.isRequired,
  setSelectedBrands: PropTypes.func.isRequired,
  selectedBrands: PropTypes.array.isRequired,
  selectedPrice: PropTypes.string,
  setSelectedPrice: PropTypes.func.isRequired,
};

FilterModal.defaultProps = {
  brands: [],
  selectedPrice: null,
};

export default FilterModal;