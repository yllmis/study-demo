package tools

import (
	"fmt"

	"github.com/spf13/viper"
)

// InitConfig 初始化配置
func InitConfig() {
	viper.SetConfigName("config") // 配置文件名 (不带扩展名)
	viper.SetConfigType("yaml")   // 配置文件类型
	viper.AddConfigPath(".")      // 查找配置文件的路径 (当前目录)

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("Fatal error config file: %w \n", err))
	}
	fmt.Println("Config loaded successfully")
}

// ...existing code...
func GetConfigString(key string) string {
	return viper.GetString(key)
}
