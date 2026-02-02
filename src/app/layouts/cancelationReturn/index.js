import { View, TouchableOpacity, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native'
import React from 'react'
import Wrapper from '../../components/wrapper'
import Icon from '../../../utils/icon'
import TextComp from '../../components/textComp'
import { moderateScale, scale, verticalScale } from 'react-native-size-matters'
import { COLORS } from '../../../res/colors'
import { width } from '../../hooks/responsive'
import { useNavigation } from '@react-navigation/native'
import RenderHTML from 'react-native-render-html'
import usePolicy from '../../hooks/usePolicy'

const CancelationAndReturns = () => {
  const navigation = useNavigation()
  const { width: contentWidth } = useWindowDimensions()

  // 👇 Fetch policy from API (type=payment_terms)
  const { data, loading } = usePolicy('cancellation_return_refund')
  // console.log('About_usDataf', data)
  return (
    <Wrapper childrenStyles={{ backgroundColor: 'white', flex: 1, width: width * 0.96 }}>

      {/* Header */}
      <View
        style={{
          height: verticalScale(50),
          width: width,
          alignSelf: 'center',
          paddingLeft: moderateScale(15),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ left: 30 }}
          style={{
            backgroundColor: COLORS.secondaryAppColor,
            height: verticalScale(30),
            width: verticalScale(30),
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={'arrowleft'}
            color={COLORS.white}
            size={scale(22)}
            type="AntDesign"
          />
        </TouchableOpacity>
        <TextComp
          style={{
            fontSize: scale(20),
            paddingLeft: 13,
            fontWeight: 'bold',
            color: COLORS.secondaryAppColor,
          }}
        >
          {`Cancellation,Return & Refund`}
        </TextComp>
      </View>

      {/* Scrollable Policy Content */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: moderateScale(10), marginTop: verticalScale(10) }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondaryAppColor} style={{ marginTop: 20 }} />
        ) : (
          data?.data?.content && (
            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: data.data.content }}
              tagsStyles={{
                p: { fontSize: scale(14), color: COLORS.black, marginBottom: 8 },
                strong: { fontWeight: 'bold', color: COLORS.secondaryAppColor },
                li: { fontSize: scale(14), color: COLORS.black, marginBottom: 4 },
              }}
            />
          )
        )}
        <View style={{ height: scale(100) }} />

      </ScrollView>
    </Wrapper>
  )
}

export default CancelationAndReturns


