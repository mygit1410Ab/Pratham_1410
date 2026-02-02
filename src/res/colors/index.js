import { DarkTheme, DefaultTheme } from "@react-navigation/native";


// export const lightTheme = {
//     dark: false,
//     colors: {
//       primaryAppColor: '#33A8A8',
//       secondaryAppColor: '#000000',
//       primaryTextColor: '#1E293B',
//       secondaryTextColor: '#64748B',
//       background: '#FFFFFF',
//       card: '#FFFFFF',
//       border: '#E2E8F0',
//       notification: '#FF2A2A',
//       // Required by React Navigation:
//       primary: '#33A8A8',
//       text: '#1E293B',
//       white: '#FFFFFF',
//       black: '#000000',
//       yellow: '#FFB200',
//       red: '#FF2A2A',
//       green: '#067C00',
//       transparent: 'transparent',
//     },
//   };

//   export const darkTheme = {
//     dark: true,
//     colors: {
//       primaryAppColor: '#616667',
//       secondaryAppColor: '#000000',
//       primaryTextColor: '#FFFFFF',
//       secondaryTextColor: '#A0AEC0',
//       background: '#121212',
//       card: '#1E1E1E',
//       border: '#2D3748',
//       notification: '#FF2A2A',
//       primary: '#616667',
//       text: '#FFFFFF',
//       white: '#FFFFFF',
//       black: '#000000',
//       yellow: '#FFB200',
//       red: '#FF2A2A',
//       green: '#067C00',
//       transparent: 'transparent',
//     },
//   };



export const COLORS = {
    primaryAppColor: 'rgba(51, 168, 168, 1)',
    primaryAppColorOpacity: (val) => `rgba(51, 168, 168, ${val})`,

    secondaryAppColor: 'rgba(0, 0, 0, 1)',

    primaryTextColor: 'rgba(71, 85, 105, 1)',
    secondaryTextColor: 'rgba(100, 116, 139, 1)',
    borderColor: 'rgba(226, 232, 240, 1)',
    background: 'rgba(255, 255, 255, 1)',

    white: 'rgb(255, 255, 255)',
    whiteOpacity: (value) => `rgba(255, 255, 255, ${value})`,

    black: 'rgb(0, 0, 0)',
    blackOpacity: (value) => `rgba(0, 0, 0, ${value})`,

    yellow: 'rgba(255, 178, 0, 1)',
    blue: 'rgba(60, 154, 251, 1)',

    // ✅ Red + opacity helper
    red: 'rgba(255, 0, 0, 1)',
    redOpacity: (value) => `rgba(255, 0, 0, ${value})`,

    green: 'rgba(6, 124, 0, 1)',
    greyOpacity: (value) => `rgba(108, 108, 108, ${value})`,
    primaryOpacity: (value) => `rgba(45, 96, 173, ${value})`,

    transparent: 'transparent',
};


export const darkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primaryAppColor: 'rgba(51, 168, 168, 1)',
        secondaryAppColor: 'rgba(0, 0, 0, 1)',
        primaryTextColor: 'rgba(71, 85, 105, 1)',
        secondaryTextColor: 'rgba(100, 116, 139, 1) ',
        borderColor: 'rgba(226, 232, 240, 1)',
        background: 'rgba(255, 255, 255, 1)',
        white: 'rgb(255, 255, 255)',
        yellow: ' rgba(255, 178, 0, 1)',
        red: `rgba(255, 42, 42, 1)`,
        green: `rgba(6, 124, 0, 1)`,
        whiteOpacity: (value) => `rgba(255, 255, 255, ${value})`,
        black: 'rgb(0, 0, 0)',
        blackOpacity: (value) => `rgba(0, 0, 0, ${value})`,
        greyOpacity: (value) => `rgba(108, 108, 108, ${value})`,
        primaryOpacity: (value) => `rgba(45,96,173,${value})`,
        transparent: 'transparent',
    }
};
