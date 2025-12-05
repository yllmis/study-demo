package tools

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type MyClaim struct {
	Username string `json:"username"`

	jwt.RegisteredClaims
}

var myStr = []byte("yllmis_secret")

func SetJwt(username string) (string, error) {

	c := MyClaim{
		Username: username,

		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "yllmis",
			NotBefore: jwt.NewNumericDate(time.Now().Add(-10 * time.Second)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(6000 * time.Second)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	s, err := jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(myStr)
	if err != nil {
		Logger.Errorf("[GetJwt]:%s", err)
	}

	return s, err

}

func ParseJwt(tokenString string) (*MyClaim, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MyClaim{}, func(t *jwt.Token) (any, error) {
		return myStr, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("校验失败，请重新登录")
	}
	claims, ok := token.Claims.(*MyClaim) // 断言类型
	if !ok {
		return nil, errors.New("解析失败，请重新登录")
	}
	return claims, nil

}
