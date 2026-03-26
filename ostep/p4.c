#include<stdio.h>
#include<unistd.h>
#include<stdlib.h>
#include<string.h>
#include<fcntl.h>
#include<sys/wait.h>

int main(int argc, char *argv[])
{
    int rc = fork();

    
    if(rc < 0)// fork failed; exit
    {
        fprintf(stderr, "fork failed\n");
        exit(1);
    }
    else if(rc == 0)// child process
    {
        close(STDOUT_FILENO); // 关闭标准输出
        open("p4.output", O_WRONLY | O_CREAT | O_TRUNC, S_IRUSR | S_IWUSR); // 创建或打开文件
        
        char *myargs[3];
        myargs[0] = strdup("wc"); // 程序名称
        myargs[1] = strdup("p4.c"); // 参数：要统计的文件
        myargs[2] = NULL; // 参数列表以NULL结尾
        execvp(myargs[0], myargs); // 执行wc命令
    }
    else// parent process
    {
        int wc = wait(NULL); // 等待子进程完成
        
    }
    return 0;
}